   const path = require('path');
   const fs = require('fs').promises;
   const mustache = require('mustache');
   const nodemailer = require('nodemailer');

  const {
    SPACEMAIL_SMTP_HOST = 'mail.spacemail.com',
    SPACEMAIL_SMTP_PORT = '465',
    SPACEMAIL_SMTP_SECURE = 'true',
    SPACEMAIL_SMTP_USERNAME,
    SPACEMAIL_SMTP_PASSWORD,
    SPACEMAIL_FROM_EMAIL,
    SPACEMAIL_FROM_NAME = 'PORNRAS',
  } = process.env;

   if (!SPACEMAIL_FROM_EMAIL && !SPACEMAIL_SMTP_USERNAME) {
     console.warn('⚠️ Spacemail gönderici adresi (SPACEMAIL_FROM_EMAIL veya SPACEMAIL_SMTP_USERNAME) tanımlı değil. E-posta gönderimleri başarısız olabilir.');
   }

  const fromEmail = SPACEMAIL_FROM_EMAIL || SPACEMAIL_SMTP_USERNAME;

  const transporter = nodemailer.createTransport({
    host: SPACEMAIL_SMTP_HOST,
    port: Number(SPACEMAIL_SMTP_PORT),
    secure: SPACEMAIL_SMTP_SECURE === 'true',
    auth: SPACEMAIL_SMTP_USERNAME && SPACEMAIL_SMTP_PASSWORD
      ? { 
          user: SPACEMAIL_SMTP_USERNAME.trim(), // Boşlukları temizle
          pass: SPACEMAIL_SMTP_PASSWORD.trim(), // Boşlukları temizle
        }
      : undefined,
    tls: {
      rejectUnauthorized: true, // Standart SSL sertifika
    },
    // Spacemail için ek ayarlar
    connectionTimeout: 30000, // 30 saniye timeout
    greetingTimeout: 30000,
    socketTimeout: 30000,
    debug: process.env.NODE_ENV === 'development', // Debug modu
    logger: process.env.NODE_ENV === 'development', // Logger
  });

   transporter.verify().catch((error) => {
     console.warn('⚠️ Spacemail SMTP bağlantısı doğrulanamadı:', error.message);
   });

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
    if (!fromEmail) {
      const cfgErr = new Error('Spacemail yapılandırması eksik (SPACEMAIL_FROM_EMAIL veya SPACEMAIL_SMTP_USERNAME).');
      cfgErr.status = 500;
      cfgErr.code = 'EMAIL_CONFIG_MISSING';
      throw cfgErr;
    }
    
    if (!SPACEMAIL_SMTP_USERNAME || !SPACEMAIL_SMTP_PASSWORD) {
      const authErr = new Error('Spacemail SMTP kimlik bilgileri eksik (SPACEMAIL_SMTP_USERNAME veya SPACEMAIL_SMTP_PASSWORD).');
      authErr.status = 500;
      authErr.code = 'EMAIL_AUTH_MISSING';
      throw authErr;
    }

    const normalizedRecipients = recipients.map((recipient) => {
      if (typeof recipient === 'string') {
        return { email: recipient, name: recipient.split('@')[0] };
      }
      return {
        email: recipient.email,
        name: recipient.name || recipient.email.split('@')[0],
      };
    });

    const toAddresses = normalizedRecipients
      .map((recipient) => (recipient.name ? `"${recipient.name}" <${recipient.email}>` : recipient.email))
      .join(', ');

    try {
      return await transporter.sendMail({
        from: `"${SPACEMAIL_FROM_NAME}" <${fromEmail}>`,
        to: toAddresses,
        subject,
        html,
        text: htmlToText(html),
      });
    } catch (err) {
      const smtpError = new Error(`SMTP send failed: ${err && err.message ? err.message : 'Unknown error'}`);
      smtpError.status = 502; // Bad gateway to indicate upstream mail failure
      smtpError.cause = err;
      throw smtpError;
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
