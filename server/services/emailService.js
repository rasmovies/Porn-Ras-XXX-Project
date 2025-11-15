   const path = require('path');
   const fs = require('fs').promises;
   const mustache = require('mustache');
   const nodemailer = require('nodemailer');

   const {
     PROTON_SMTP_HOST = '127.0.0.1',
     PROTON_SMTP_PORT = '1025',
     PROTON_SMTP_SECURE = 'false',
     PROTON_SMTP_USERNAME = 'pornras@proton.me',
     PROTON_SMTP_PASSWORD ='MoQL_M-Loyi1fB3b9tKWew',
     PROTON_FROM_EMAIL = 'pornras@proton.me',
     PROTON_FROM_NAME = 'PORNRAS',
    REACT_APP_API_BASE_URL = 'https://server-dlcvvf7tu-ras-projects-6ebe5a01.vercel.app',
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

   async function renderTemplate(templateName, data) {
        const templatePath = path.join(__dirname, '..', 'emailTemplates', `${templateName}.html`);
     const template = await fs.readFile(templatePath, 'utf-8');
     return mustache.render(template, data);
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
       throw new Error('Proton Mail yapılandırması eksik (PROTON_FROM_EMAIL).');
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

     return transporter.sendMail({
       from: `"${PROTON_FROM_NAME}" <${PROTON_FROM_EMAIL}>`,
       to: toAddresses,
       subject,
       html,
       text: htmlToText(html),
     });
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
