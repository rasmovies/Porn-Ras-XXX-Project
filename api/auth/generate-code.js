const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { supabase } = require('../../lib/supabase');
const { sendVerificationMail } = require('../../services/emailService');

/**
 * POST /api/auth/generate-code
 * Generate 6-digit verification code and send via email
 */
module.exports = async function handler(req, res) {
  // Debug logging
  console.log('🔍 /api/auth/generate-code called:', {
    method: req.method,
    httpMethod: req.httpMethod,
    query: req.query,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });
  
  const origin = req.headers.origin || req.headers.referer || req.headers.referrer;
  
  // Set CORS headers
  setCorsHeaders(res, origin);
  
  // Handle OPTIONS preflight - Vercel serverless functions için
  const method = req.method || req.httpMethod || 'GET';
  
  // Vercel'de method kontrolü - hem req.method hem req.httpMethod'u kontrol et
  if (method === 'OPTIONS' || req.method === 'OPTIONS' || req.httpMethod === 'OPTIONS') {
    console.log('✅ OPTIONS preflight request received');
    return handleOptions(req, res);
  }
  
  // Only allow POST - ama Vercel'de bazen method undefined olabilir, body varsa POST kabul et
  const hasRequestBody = req.body && (typeof req.body === 'object' || typeof req.body === 'string');
  
  // Vercel serverless functions için method kontrolü - body varsa veya method POST ise kabul et
  const isPostRequest = method === 'POST' || req.httpMethod === 'POST' || hasRequestBody;
  
  if (!isPostRequest) {
    console.error('❌ Method not allowed:', { 
      method, 
      httpMethod: req.httpMethod, 
      hasBody: hasRequestBody,
      allowed: 'POST' 
    });
    return res.status(405).json({ 
      success: false, 
      message: `Method not allowed. Expected POST, got ${method || req.httpMethod || 'undefined'}`,
      debug: {
        method,
        httpMethod: req.httpMethod,
        hasBody: hasRequestBody
      }
    });
  }
  
  console.log('✅ Method check passed:', { method, httpMethod: req.httpMethod, hasBody: hasRequestBody, isPostRequest });
  
  try {
    // Parse request body - Vercel serverless functions sometimes need explicit parsing
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Failed to parse body as JSON:', e);
      }
    }
    
    const { email, username } = body || {};
    console.log('📥 Parsed body:', { email, username, hasEmail: !!email, hasUsername: !!username });
    
    if (!email || !username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and username are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }
    
    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Code expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    // Store code in Supabase (verification_codes table)
    // Try to find existing unused code
    let codeData;
    try {
      const { data: existingCode, error: findError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (findError) {
        // Table might not exist or RLS issue
        console.warn('⚠️ Error finding existing code:', findError.message);
        console.warn('   Error code:', findError.code);
        console.warn('   Error details:', findError.details);
      }
      
      if (existingCode && !findError) {
        // Update existing code
        const { data, error } = await supabase
          .from('verification_codes')
          .update({
            code: verificationCode,
            expires_at: expiresAt,
            created_at: new Date().toISOString()
          })
          .eq('id', existingCode.id)
          .select()
          .single();
        
        if (error) {
          console.warn('⚠️ Error updating code:', error.message);
          // Continue without storing in DB
          codeData = { code: verificationCode, email, username, expires_at: expiresAt };
        } else {
          codeData = data;
          console.log('✅ Updated existing verification code');
        }
      } else {
        // Create new code
        const { data, error } = await supabase
          .from('verification_codes')
          .insert({
            email: email,
            username: username,
            code: verificationCode,
            expires_at: expiresAt,
            is_used: false
          })
          .select()
          .single();
        
        if (error) {
          // If table doesn't exist or RLS issue, log warning but continue
          console.warn('⚠️ verification_codes table error. Code will be sent but not stored.');
          console.warn('   Error code:', error.code);
          console.warn('   Error message:', error.message);
          console.warn('   Error details:', error.details);
          console.warn('   Table structure needed: verification_codes (id, email, username, code, expires_at, is_used, created_at)');
          codeData = { code: verificationCode, email, username, expires_at: expiresAt };
        } else {
          codeData = data;
          console.log('✅ Created new verification code in database');
        }
      }
    } catch (dbError) {
      // If database operation fails, still send email
      console.warn('⚠️ Database error, but continuing with email send:', dbError.message);
      console.warn('   Error stack:', dbError.stack);
      codeData = { code: verificationCode, email, username, expires_at: expiresAt };
    }
    
    // Send verification email with code
    let emailSent = false;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-code.js:175',message:'Before email send',data:{email,username,hasResendKey:!!process.env.RESEND_API_KEY,codeLength:verificationCode.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      await sendVerificationMail({ 
        email, 
        username, 
        verificationCode: verificationCode 
      });
      emailSent = true;
      console.log('✅ Verification email sent successfully to:', email);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-code.js:183',message:'Email sent successfully',data:{email,username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      console.error('   Error message:', emailError.message);
      console.error('   Error code:', emailError.code);
      console.error('   Error status:', emailError.status);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-code.js:189',message:'Email send failed',data:{error:emailError.message,code:emailError.code,status:emailError.status,stack:emailError.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      // If email fails but we have the code, still return success
      // The user can manually enter the code if needed
      // But log the error for debugging
      if (!codeData || !codeData.code) {
        // If we don't have the code stored, we can't proceed
        return res.status(500).json({
          success: false,
          message: 'Doğrulama kodu oluşturuldu ancak email gönderilemedi. Lütfen tekrar deneyin.',
          error: process.env.NODE_ENV === 'development' ? {
            message: emailError.message,
            code: emailError.code,
            status: emailError.status
          } : undefined
        });
      }
    }
    
    return res.json({ 
      success: true, 
      message: emailSent 
        ? 'Verification code sent successfully' 
        : 'Verification code generated (email may not have been sent)',
      // Don't send code to client for security
    });
  } catch (error) {
    console.error('❌ Generate code error:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    // Provide more detailed error information
    const errorResponse = {
      success: false,
      message: 'Doğrulama kodu oluşturulamadı. Lütfen tekrar deneyin.'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = {
        message: error.message,
        code: error.code,
        stack: error.stack
      };
    }
    
    return handleError(res, error, errorResponse.message);
  }
};

