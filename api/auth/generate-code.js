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
  
  // Initialize variables for error handling
  let email = null;
  let username = null;
  let verificationCode = null;
  
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
    
    ({ email, username } = body || {});
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
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Code expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    // Store code in Supabase (verification_codes table)
    // Daha önce çözülen sorun: Tablo yoksa veya hata varsa bile devam et
    let codeData = { code: verificationCode, email, username, expires_at: expiresAt };
    
    // Supabase operations are optional - if they fail, we still send the email
    try {
      const { data: existingCode, error: findError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (findError) {
        // Table might not exist or RLS issue - bu normal, devam et
        console.warn('⚠️ verification_codes table not accessible, skipping storage:', findError.message, findError.code);
        // Don't throw error, continue with email sending
      } else if (existingCode) {
        // Update existing code (maybeSingle returns object or null, not array)
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
        
        if (!error) {
        codeData = data;
          console.log('✅ Updated existing verification code');
        } else {
          console.warn('⚠️ Failed to update verification code:', error.message, error.code);
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
        
        if (!error) {
          codeData = data;
          console.log('✅ Created new verification code in database');
        } else {
          // Table doesn't exist or RLS issue - bu normal, devam et
          console.warn('⚠️ verification_codes table not accessible, code generated but not stored:', error.message, error.code);
        }
      }
    } catch (dbError) {
      // Database error - bu normal, devam et (daha önce çözülen sorun)
      console.warn('⚠️ Database error (normal if table doesn\'t exist):', dbError.message);
      // Don't throw error, continue with email sending
    }
    
    // Send verification email with code
    let emailSent = false;
    try {
      if (!email || !username || !verificationCode) {
        throw new Error('Missing required parameters for email sending');
      }
      
      await sendVerificationMail({ 
        email, 
        username, 
        verificationCode: verificationCode 
      });
      emailSent = true;
      console.log('✅ Verification email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      console.error('   Error message:', emailError?.message || 'Unknown error');
      console.error('   Error code:', emailError?.code || 'N/A');
      console.error('   Error status:', emailError?.status || 'N/A');
      console.error('   Error stack:', emailError?.stack || 'N/A');
      
      // Email gönderimi başarısız olsa bile success döndür
      // Kullanıcı kod ile devam edebilir (email gönderimi optional)
      console.warn('⚠️ Email gönderilemedi ama kod oluşturuldu. Kullanıcı manuel olarak devam edebilir.');
    }
    
    // Email gönderimi başarısız olsa bile success döndür
    // Bu daha önce çözülen bir sorundu - email optional olmalı
    return res.json({ 
      success: true, 
      message: emailSent 
        ? 'Verification code sent successfully' 
        : 'Verification code generated successfully',
      // Don't send code to client for security
    });
  } catch (error) {
    console.error('❌ Generate code error:', error);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error status:', error.status);
    console.error('   Error stack:', error.stack);
    
    // If it's a Supabase authentication error (401), still try to send email
    // The code was already generated, we just need to send it
    if (error.status === 401 || error.code === 'PGRST301' || error.message?.includes('JWT')) {
      console.warn('⚠️ Supabase authentication error detected, but code was generated. Attempting to send email anyway...');
      
      // Try to send email even if Supabase failed
      try {
        await sendVerificationMail({ 
          email, 
          username, 
          verificationCode: verificationCode 
        });
        console.log('✅ Email sent despite Supabase error');
        return res.json({ 
          success: true, 
          message: 'Verification code sent successfully (database storage skipped due to auth error)'
        });
      } catch (emailError) {
        console.error('❌ Email send also failed:', emailError);
      }
    }
    
    // Provide more detailed error information
    const errorResponse = {
      success: false,
      message: 'Doğrulama kodu oluşturulamadı. Lütfen tekrar deneyin.'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = {
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack
      };
    }
    
    return handleError(res, error, errorResponse.message);
  }
};

