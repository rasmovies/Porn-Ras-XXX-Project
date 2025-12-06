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
     // Candidate locations (ordered by likelihood)
     const candidatePaths = [
       // When running locally or when __dirname resolves correctly
       path.join(__dirname, '..', 'emailTemplates', `${templateName}.html`),
       // When process.cwd() is project root and server files live under "server/"
       path.join(process.cwd(), 'server', 'emailTemplates', `${templateName}.html`),
       // When current working dir already is "server/"
       path.join(process.cwd(), 'emailTemplates', `${templateName}.html`),
     ];
 
     let lastError;
     for (const filePath of candidatePaths) {
       try {
         const template = await fs.readFile(filePath, 'utf-8');
         return mustache.render(template, data);
       } catch (err) {
         lastError = err;
       }
     }
 
     const error = new Error(
       `Email template not found for "${templateName}". Checked: ${candidatePaths.join(' | ')}`
     );
     error.cause = lastError;
     error.status = 500;
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
     // If verificationCode is provided, use code-based template
     // Otherwise use URL-based template (backward compatibility)
     if (verificationCode) {
       const html = await renderTemplate('verification', { username, verificationCode });
       return dispatchEmail({ recipients: [email], subject: 'PORNRAS - Doğrulama Kodu', html });
     } else {
       const html = await renderTemplate('verification', { username, verifyUrl });
       return dispatchEmail({ recipients: [email], subject: 'Hesabını Doğrula', html });
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
