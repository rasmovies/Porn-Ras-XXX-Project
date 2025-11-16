   const path = require('path');
   const fs = require('fs').promises;
   const mustache = require('mustache');
   const nodemailer = require('nodemailer');

  const {
    PROTON_SMTP_HOST,
    PROTON_SMTP_PORT = '1025',
    PROTON_SMTP_SECURE = 'false',
    PROTON_SMTP_USERNAME,
    PROTON_SMTP_PASSWORD,
    PROTON_FROM_EMAIL,
    PROTON_FROM_NAME = 'PORNRAS',
  } = process.env;

   if (!PROTON_FROM_EMAIL) {
     console.warn('⚠️ Proton Mail gönderici adresi (PROTON_FROM_EMAIL) tanımlı değil. E-posta gönderimleri başarısız olabilir.');
   }

   const transporter = nodemailer.createTransport({
     host: PROTON_SMTP_HOST,
     port: Number(PROTON_SMTP_PORT),
     secure: PROTON_SMTP_SECURE === 'true',
     auth: PROTON_SMTP_USERNAME && PROTON_SMTP_PASSWORD
       ? { user: PROTON_SMTP_USERNAME, pass: PROTON_SMTP_PASSWORD }
       : undefined,
   });

   transporter.verify().catch((error) => {
     console.warn('⚠️ Proton Mail SMTP bağlantısı doğrulanamadı:', error.message);
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
     if (!PROTON_FROM_EMAIL) {
       const cfgErr = new Error('Proton Mail yapılandırması eksik (PROTON_FROM_EMAIL).');
       cfgErr.status = 500;
       throw cfgErr;
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
         from: `"${PROTON_FROM_NAME}" <${PROTON_FROM_EMAIL}>`,
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

   async function sendVerificationMail({ email, username, verifyUrl }) {
     const html = await renderTemplate('verification', { username, verifyUrl });
     return dispatchEmail({ recipients: [email], subject: 'Hesabını Doğrula', html });
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

   module.exports = {
     sendVerificationMail,
     sendInviteMail,
     sendMarketingMail,
   };
