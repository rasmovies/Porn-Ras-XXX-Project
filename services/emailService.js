   const path = require('path');
   const fs = require('fs').promises;
   const mustache = require('mustache');
   const { Resend } = require('resend');

  // Resend API Configuration
  const {
    RESEND_API_KEY,
    RESEND_FROM_EMAIL = 'info@pornras.com',
    RESEND_FROM_NAME = 'PORNRAS',
  } = process.env;

  // Initialize Resend client
  const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY tanımlı değil. E-posta gönderimleri başarısız olacak.');
  }

  const fromEmail = RESEND_FROM_EMAIL;

   /**
    * Resolve template file path reliably in Vercel serverless env.
    * Falls back between several base directories to avoid ENOENT.
    */
   async function renderTemplate(templateName, data) {
     // #region agent log
     fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:26',message:'renderTemplate entry',data:{templateName,__dirname,processCwd:process.cwd()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
     // #endregion
     // Candidate locations (ordered by likelihood)
     const candidatePaths = [
       // When running locally or when __dirname resolves correctly
       path.join(__dirname, '..', 'emailTemplates', `${templateName}.html`),
       // When process.cwd() is project root and server files live under "server/"
       path.join(process.cwd(), 'server', 'emailTemplates', `${templateName}.html`),
       // When current working dir already is "server/"
       path.join(process.cwd(), 'emailTemplates', `${templateName}.html`),
     ];
     // #region agent log
     fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:35',message:'Template paths to check',data:{candidatePaths},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
     // #endregion

     let lastError;
     for (const filePath of candidatePaths) {
       try {
         // #region agent log
         fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:40',message:'Trying template path',data:{filePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
         // #endregion
         const template = await fs.readFile(filePath, 'utf-8');
         // #region agent log
         fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:42',message:'Template file found and read',data:{filePath,templateLength:template.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
         // #endregion
         return mustache.render(template, data);
       } catch (err) {
         lastError = err;
         // #region agent log
         fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:45',message:'Template path failed',data:{filePath,error:err.message,code:err.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
         // #endregion
       }
     }

     const error = new Error(
       `Email template not found for "${templateName}". Checked: ${candidatePaths.join(' | ')}`
     );
     error.cause = lastError;
     error.status = 500;
     // #region agent log
     fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:52',message:'All template paths failed - throwing error',data:{templateName,error:error.message,lastError:lastError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
     // #endregion
     throw error;
   }

   function htmlToText(html) {
     return html
       .replace(/<\/p>/gi, '\n\n')
       .replace(/<br\s*\/?>/gi, '\n')
       .replace(/<[^>]*>/g, '')
       .replace(/\n{3,}/g, '\n\n')
       .trim();
   }

  async function dispatchEmail({ recipients, subject, html }) {
    if (!resend) {
      const cfgErr = new Error('Resend API yapılandırması eksik (RESEND_API_KEY).');
      cfgErr.status = 500;
      cfgErr.code = 'EMAIL_CONFIG_MISSING';
      throw cfgErr;
    }

    if (!fromEmail) {
      const cfgErr = new Error('Gönderici e-posta adresi tanımlı değil (RESEND_FROM_EMAIL).');
      cfgErr.status = 500;
      cfgErr.code = 'EMAIL_FROM_MISSING';
      throw cfgErr;
    }

    // Normalize recipients to array format
    const normalizedRecipients = Array.isArray(recipients) ? recipients : [recipients];
    const toEmails = normalizedRecipients.map((recipient) => {
      if (typeof recipient === 'string') {
        return recipient;
      }
      return recipient.email;
    });

    try {
      const result = await resend.emails.send({
        from: `"${RESEND_FROM_NAME}" <${fromEmail}>`,
        to: toEmails,
        subject,
        html,
        text: htmlToText(html),
      });

      if (result.error) {
        const apiError = new Error(`Resend API error: ${result.error.message || 'Unknown error'}`);
        apiError.status = 502;
        apiError.code = 'RESEND_API_ERROR';
        throw apiError;
      }

      return result;
    } catch (err) {
      const apiError = new Error(`Email send failed: ${err && err.message ? err.message : 'Unknown error'}`);
      apiError.status = 502; // Bad gateway to indicate upstream mail failure
      apiError.cause = err;
      throw apiError;
    }
  }

   async function sendVerificationMail({ email, username, verifyUrl, verificationCode }) {
     // #region agent log
     fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:113',message:'sendVerificationMail entry',data:{email,username,hasVerificationCode:!!verificationCode,hasVerifyUrl:!!verifyUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
     // #endregion
     // Check if RESEND_API_KEY is configured
     // #region agent log
     fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:115',message:'RESEND_API_KEY check',data:{hasResendKey:!!RESEND_API_KEY,resendKeyLength:RESEND_API_KEY?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
     // #endregion
     if (!RESEND_API_KEY) {
       const error = new Error('RESEND_API_KEY is not configured. Email cannot be sent.');
       error.status = 500;
       error.code = 'EMAIL_CONFIG_MISSING';
       // #region agent log
       fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:119',message:'RESEND_API_KEY missing - throwing error',data:{error:error.message,code:error.code,status:error.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
       // #endregion
       throw error;
     }
     
     try {
       // If verificationCode is provided, use code-based template
       // Otherwise use URL-based template (backward compatibility)
       if (verificationCode) {
         // #region agent log
         fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:125',message:'Before template render - verification code',data:{username,hasCode:!!verificationCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
         // #endregion
         const html = await renderTemplate('verification', { username, verificationCode });
         // #region agent log
         fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:127',message:'Template rendered successfully',data:{htmlLength:html?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
         // #endregion
         return dispatchEmail({ recipients: [email], subject: 'PORNRAS - Doğrulama Kodu', html });
       } else {
         const html = await renderTemplate('verification', { username, verifyUrl });
         return dispatchEmail({ recipients: [email], subject: 'Hesabını Doğrula', html });
       }
     } catch (templateError) {
       console.error('❌ Template rendering error:', templateError);
       // #region agent log
       fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:135',message:'Template rendering error - using fallback',data:{error:templateError.message,code:templateError.code,stack:templateError.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
       // #endregion
       // If template fails, send a simple text email
       const simpleHtml = `
         <html>
           <body>
             <h2>PORNRAS - Doğrulama Kodu</h2>
             <p>Merhaba ${username},</p>
             <p>Doğrulama kodunuz: <strong>${verificationCode || 'N/A'}</strong></p>
             <p>Bu kod 15 dakika geçerlidir.</p>
           </body>
         </html>
       `;
       // #region agent log
       fetch('http://127.0.0.1:7242/ingest/77de285f-aa7f-4dd5-85ce-8cdd4fbaf322',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'emailService.js:147',message:'Using fallback HTML email',data:{simpleHtmlLength:simpleHtml.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
       // #endregion
       return dispatchEmail({ recipients: [email], subject: 'PORNRAS - Doğrulama Kodu', html: simpleHtml });
     }
   }

   async function sendInviteMail({ inviterName, inviteeEmail, inviteUrl }) {
     const html = await renderTemplate('invite', { inviterName, inviteUrl });
     return dispatchEmail({
       recipients: [inviteeEmail],
       subject: `${inviterName} seni PORNRAS'a davet ediyor`,
       html,
     });
   }

  async function sendMarketingMail({ recipients, subject, headline, message, ctaUrl, ctaLabel = 'İncele', unsubscribeUrl }) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Gönderilecek en az bir e-posta adresi gerekli.');
    }

    const html = await renderTemplate('marketing', {
      subject,
      headline,
      message,
      ctaUrl,
      ctaLabel,
      unsubscribeUrl: unsubscribeUrl || '#',
    });

    return dispatchEmail({ recipients, subject, html });
  }

  async function sendWelcomeMail({ email, name }) {
    const html = await renderTemplate('welcome', { email, name });
    return dispatchEmail({ 
      recipients: [email], 
      subject: 'Welcome to PORNRAS!', 
      html 
    });
  }

  module.exports = {
    sendVerificationMail,
    sendInviteMail,
    sendMarketingMail,
    sendWelcomeMail,
  };
