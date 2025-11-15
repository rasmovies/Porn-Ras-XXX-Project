const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { shareVideoToBluesky, postToBluesky } = require('../services/blueskyService');

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/bluesky/share-video
 * Yeni video paylaşımı için Bluesky'de post yayınla
 */
router.post(
  '/share-video',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('slug').notEmpty().withMessage('Slug is required'),
    body('thumbnail').optional().isURL().withMessage('Thumbnail must be a valid URL'),
    body('description').optional().isString(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { title, description, thumbnail, slug } = req.body;

      const result = await shareVideoToBluesky({
        title,
        description,
        thumbnail,
        slug,
      });

      res.json({
        success: true,
        message: 'Video Bluesky\'de paylaşıldı',
        data: result,
      });
    } catch (error) {
      console.error('Bluesky share video error:', error);
      res.status(500).json({
        success: false,
        message: 'Bluesky paylaşımı başarısız',
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/bluesky/post
 * Genel post yayınla
 */
router.post(
  '/post',
  [
    body('text').notEmpty().withMessage('Text is required'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('linkUrl').optional().isURL().withMessage('Link URL must be a valid URL'),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { text, imageUrl, linkUrl } = req.body;

      const result = await postToBluesky(text, imageUrl, linkUrl);

      res.json({
        success: true,
        message: 'Bluesky\'de post yayınlandı',
        data: result,
      });
    } catch (error) {
      console.error('Bluesky post error:', error);
      res.status(500).json({
        success: false,
        message: 'Bluesky post başarısız',
        error: error.message,
      });
    }
  }
);

module.exports = router;


