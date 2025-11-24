const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendVerificationMail, sendInviteMail, sendMarketingMail, sendMagicLinkMail, sendWelcomeMail } = require('../services/emailService');

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
      // eslint-disable-next-line no-console
      console.error('Verification mail error:', error);
      
      // Daha açıklayıcı hata mesajları
      let errorMessage = 'Mail gönderilemedi.';
      if (error.code === 'ESOCKET' || error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Email servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (error.code === 'EAUTH' || error.message?.includes('invalid username or password')) {
        errorMessage = 'Email servisi yapılandırma hatası. Lütfen yöneticiyle iletişime geçin.';
      } else if (error.message) {
        errorMessage = `Mail gönderilemedi: ${error.message}`;
      }
      
      return res.status(500).json({ success: false, message: errorMessage });
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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error('Marketing mail error:', error);
      return res.status(500).json({ success: false, message: 'Mail gönderilemedi.' });
    }
  }
);

router.post(
  '/magic-link',
  [
    body('email').isEmail().withMessage('Geçerli bir e-posta girin.'),
    body('magicLink').isURL().withMessage('Magic link geçerli değil.'),
  ],
  handleValidation,
  async (req, res) => {
    const { email, magicLink } = req.body;
    try {
      await sendMagicLinkMail({ email, magicLink });
      return res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Magic link mail error:', error);
      
      let errorMessage = 'Mail gönderilemedi.';
      if (error.code === 'ESOCKET' || error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Email servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (error.code === 'EAUTH' || error.message?.includes('invalid username or password')) {
        errorMessage = 'Email servisi yapılandırma hatası. Lütfen yöneticiyle iletişime geçin.';
      } else if (error.message) {
        errorMessage = `Mail gönderilemedi: ${error.message}`;
      }
      
      return res.status(500).json({ success: false, message: errorMessage });
    }
  }
);

router.post(
  '/welcome',
  [
    body('email').isEmail().withMessage('Geçerli bir e-posta girin.'),
    body('name').isString().trim().notEmpty().withMessage('İsim gerekli.'),
  ],
  handleValidation,
  async (req, res) => {
    const { email, name } = req.body;
    try {
      await sendWelcomeMail({ email, name });
      return res.json({ success: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Welcome mail error:', error);
      
      let errorMessage = 'Mail gönderilemedi.';
      if (error.code === 'ESOCKET' || error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Email servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (error.code === 'EAUTH' || error.message?.includes('invalid username or password')) {
        errorMessage = 'Email servisi yapılandırma hatası. Lütfen yöneticiyle iletişime geçin.';
      } else if (error.message) {
        errorMessage = `Mail gönderilemedi: ${error.message}`;
      }
      
      return res.status(500).json({ success: false, message: errorMessage });
    }
  }
);

module.exports = router;

