   const express = require('express');
   const { body, validationResult } = require('express-validator');
   const { sendVerificationMail, sendInviteMail, sendMarketingMail } = require('../services/emailService');

   const router = express.Router();

   const handleValidation = (req, res, next) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(422).json({ errors: errors.array() });
     }
     return next();
   };

   router.post(
     '/verification',
     [
       body('email').isEmail().withMessage('Geçerli bir e-posta girin.'),
       body('username').isString().trim().notEmpty().withMessage('Kullanıcı adı gerekli.'),
       body('verifyUrl').isURL().withMessage('Doğrulama linki geçerli değil.'),
     ],
     handleValidation,
     async (req, res) => {
       const { email, username, verifyUrl } = req.body;
       try {
         await sendVerificationMail({ email, username, verifyUrl });
         return res.json({ success: true });
       } catch (error) {
         console.error('Verification mail error:', error);
         return res.status(500).json({ success: false, message: 'Mail gönderilemedi.' });
       }
     }
   );

   router.post(
     '/invite',
     [
       body('inviterName').isString().trim().notEmpty().withMessage('Daveti gönderen ismi gerekli.'),
       body('inviteeEmail').isEmail().withMessage('Daveti alacak geçerli e-posta gerekli.'),
       body('inviteUrl').isURL().withMessage('Davet linki geçerli değil.'),
     ],
     handleValidation,
     async (req, res) => {
       const { inviterName, inviteeEmail, inviteUrl } = req.body;
       try {
         await sendInviteMail({ inviterName, inviteeEmail, inviteUrl });
         return res.json({ success: true });
       } catch (error) {
         console.error('Invite mail error:', error);
         return res.status(500).json({ success: false, message: 'Mail gönderilemedi.' });
       }
     }
   );

   router.post(
     '/marketing',
     [
       body('subject').isString().trim().notEmpty(),
       body('headline').isString().trim().notEmpty(),
       body('message').isString().trim().notEmpty(),
       body('recipients').isArray({ min: 1 }).withMessage('En az bir alıcı e-postası gerekli.'),
       body('recipients.*').isEmail(),
       body('ctaUrl').optional().isURL(),
       body('ctaLabel').optional().isString().trim(),
       body('unsubscribeUrl').optional().isURL(),
     ],
     handleValidation,
     async (req, res) => {
       const { recipients, subject, headline, message, ctaUrl, ctaLabel, unsubscribeUrl } = req.body;
       try {
         await sendMarketingMail({ recipients, subject, headline, message, ctaUrl, ctaLabel, unsubscribeUrl });
         return res.json({ success: true });
       } catch (error) {
         console.error('Marketing mail error:', error);
         return res.status(500).json({ success: false, message: 'Mail gönderilemedi.' });
       }
     }
   );

   module.exports = router;
   ```


   ```javascript
   const path = require('path');
   const fs = require('fs').promises;
   const mustache = require('mustache');
   const nodemailer = require('nodemailer');

   const {
     PROTON_SMTP_HOST = '127.0.0.1',
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
   ```

3. `server/emailTemplates/verification.html`, `invite.html`, `marketing.html` dosyalarını da GitHub’da aynı klasör yapısıyla oluştur (frontendten kopyalayabilirsin). Örnek olarak verification:

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Hesabını Doğrula</title>
</head>
<body>
  <h1>Merhaba {{username}},</h1>
  <p>PORNRAS hesabını doğrulamak için aşağıdaki bağlantıya tıkla:</p>
  <p><a href="{{verifyUrl}}">Hesabımı doğrula</a></p>
  <p>Bu bağlantı bir saat içinde geçersiz olur.</p>
</body>
</html>
```






