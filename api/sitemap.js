const { createClient } = require('@supabase/supabase-js');

const SITE_URL = process.env.SITE_URL || 'https://www.pornras.com';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not found. Sitemap will only include static pages.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Generate dynamic sitemap XML
 */
async function generateSitemap() {
  const urls = [];
  const today = new Date().toISOString().split('T')[0];

  // Static pages
  urls.push({
    loc: `${SITE_URL}/`,
    lastmod: today,
    changefreq: 'daily',
    priority: '1.0'
  });

  urls.push({
    loc: `${SITE_URL}/search`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.8'
  });

  urls.push({
    loc: `${SITE_URL}/models`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.9'
  });

  urls.push({
    loc: `${SITE_URL}/channels`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.9'
  });

  urls.push({
    loc: `${SITE_URL}/categories`,
    lastmod: today,
    changefreq: 'daily',
    priority: '0.9'
  });

  // Legal pages
  const legalPages = ['terms', 'privacy', 'dmca', '2257'];
  legalPages.forEach(page => {
    urls.push({
      loc: `${SITE_URL}/${page}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.5'
    });
  });

  try {
    if (!supabase) {
      console.warn('⚠️ Supabase client not initialized, skipping dynamic content');
      // Return only static pages
    } else {
      // Fetch videos (limit to prevent timeout)
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('slug, id, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(2000); // Limit to prevent timeout

      if (!videosError && videos) {
        videos.forEach(video => {
          const slug = video.slug || video.id;
          const lastmod = video.updated_at 
            ? new Date(video.updated_at).toISOString().split('T')[0]
            : (video.created_at 
              ? new Date(video.created_at).toISOString().split('T')[0]
              : today);
          
          urls.push({
            loc: `${SITE_URL}/video/${slug}`,
            lastmod,
            changefreq: 'weekly',
            priority: '0.8'
          });
        });
      }

      // Fetch models (limit to prevent timeout)
      const { data: models, error: modelsError } = await supabase
        .from('models')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!modelsError && models) {
        models.forEach(model => {
          const slug = model.name.toLowerCase().replace(/\s+/g, '-');
          const lastmod = model.created_at 
            ? new Date(model.created_at).toISOString().split('T')[0]
            : today;
          
          urls.push({
            loc: `${SITE_URL}/models/${slug}`,
            lastmod,
            changefreq: 'weekly',
            priority: '0.7'
          });
        });
      }

      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!categoriesError && categories) {
        categories.forEach(category => {
          const slug = category.name.toLowerCase().replace(/\s+/g, '-');
          const lastmod = category.created_at 
            ? new Date(category.created_at).toISOString().split('T')[0]
            : today;
          
          urls.push({
            loc: `${SITE_URL}/categories/${slug}`,
            lastmod,
            changefreq: 'weekly',
            priority: '0.7'
          });
        });
      }

      // Fetch channels
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(300);

      if (!channelsError && channels) {
        channels.forEach(channel => {
          const slug = channel.name.toLowerCase().replace(/\s+/g, '-');
          const lastmod = channel.created_at 
            ? new Date(channel.created_at).toISOString().split('T')[0]
            : today;
          
          urls.push({
            loc: `${SITE_URL}/channels/${slug}`,
            lastmod,
            changefreq: 'weekly',
            priority: '0.7'
          });
        });
      }

      // Fetch unique tags from videos
      const { data: videosWithTags, error: tagsError } = await supabase
        .from('videos')
        .select('tags')
        .not('tags', 'is', null)
        .limit(1000);

      if (!tagsError && videosWithTags) {
        const uniqueTags = new Set();
        videosWithTags.forEach(video => {
          if (video.tags) {
            const tags = video.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
            tags.forEach(tag => uniqueTags.add(tag));
          }
        });

        uniqueTags.forEach(tag => {
          urls.push({
            loc: `${SITE_URL}/tag/${encodeURIComponent(tag)}`,
            lastmod: today,
            changefreq: 'weekly',
            priority: '0.6'
          });
        });
      }
    } // End of supabase check

  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Continue with static pages even if dynamic content fails
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Vercel serverless function handler
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/xml');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const sitemap = await generateSitemap();
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
};

