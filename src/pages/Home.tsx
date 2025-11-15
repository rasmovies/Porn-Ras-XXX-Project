import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, CircularProgress } from '@mui/material';
import { motion } from 'motion/react';
import { settingsService, videoService } from '../services/database';
import { Video } from '../lib/supabase';
import SEO from '../components/SEO/SEO';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [heroTitle, setHeroTitle] = useState<string>('');
  const [heroSubtitle, setHeroSubtitle] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);

  // Load videos from Supabase
  useEffect(() => {
    const loadVideos = async () => {
      setLoadingVideos(true);
      try {
        const videos = await videoService.getAll();
        setAllVideos(videos);
      } catch (error) {
        console.error('Failed to load videos:', error);
      } finally {
        setLoadingVideos(false);
      }
    };

    loadVideos();
  }, []);

  // Load background image and hero text from Supabase
  useEffect(() => {
    const loadHomepageSettings = async () => {
      setImageLoading(true);
      try {
        const bgImage = await settingsService.getValue('homepage_background_image');
        if (bgImage) {
          setBackgroundImage(bgImage);
        }
      } catch (error) {
        console.error('Failed to load background image:', error);
      }

      try {
        const title = await settingsService.getValue('homepage_hero_title');
        setHeroTitle(title || '');
      } catch (error) {
        console.error('Failed to load hero title:', error);
      }

      try {
        const subtitle = await settingsService.getValue('homepage_hero_subtitle');
        setHeroSubtitle(subtitle || '');
      } catch (error) {
        console.error('Failed to load hero subtitle:', error);
      }
      setImageLoading(false);
    };

    loadHomepageSettings();
  }, []);


  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  return (
    <>
      <SEO
        title="PORNRAS - Adult Content Platform"
        description={heroSubtitle || "Your ultimate destination for premium adult content. Watch videos, browse models, channels, and categories."}
        image={backgroundImage || "/PORNRAS.png"}
        url="/"
        type="website"
        keywords="adult content, videos, models, channels, categories"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "PORNRAS",
          "url": "https://pornras.com",
          "description": "Your ultimate destination for premium adult content",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://pornras.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
    <Box>
      {/* Hero Banner */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: '350px', sm: '400px', md: '500px' },
          mb: 4,
          overflow: 'hidden',
        }}
      >
        {backgroundImage ? (
          <Box
            component="img"
            src={backgroundImage}
            alt="Hero Background"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: imageLoading ? 'none' : 'block',
            }}
            onLoad={() => setImageLoading(false)}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
        )}
        {imageLoading && backgroundImage && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        )}
        
        {/* Content Overlay - Only show if title/subtitle exist */}
        {(heroTitle || heroSubtitle) && !imageLoading && backgroundImage && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
              px: 4,
            }}
          >
            <Box sx={{ textAlign: 'center', zIndex: 2 }}>
              {heroTitle && heroTitle.trim() && (
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'white',
                    mb: heroSubtitle && heroSubtitle.trim() ? 2 : 0,
                    textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                  }}
                >
                  {heroTitle}
                </Typography>
              )}
              {heroSubtitle && heroSubtitle.trim() && (
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white',
                    opacity: 0.9,
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                  }}
                >
                  {heroSubtitle}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ width: '100%', mt: 0 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2, px: 0, fontWeight: 'bold' }}>
          LATEST VIDEOS
        </Typography>
        {loadingVideos ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : allVideos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No videos found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Upload your first video to get started
            </Typography>
          </Box>
        ) : (
          <Box
            className="video-grid"
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: 'repeat(2, minmax(0, 1fr))', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(3, 1fr)', 
                lg: 'repeat(4, 1fr)' 
              }, 
              gap: 1,
              width: '100%'
            }}
          >
              {allVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleVideoClick(video.slug || video.id)}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', // 16:9 aspect ratio
                      overflow: 'hidden',
                      borderRadius: 2,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      boxShadow: index < 6 ? '0 0 5px rgba(255, 215, 0, 0.3)' : 'none',
                      animation: index < 6 ? 'goldSparkle 3s infinite ease-in-out' : 'none',
                      '&:hover': {
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                      },
                      '@keyframes goldSparkle': {
                        '0%, 100%': {
                          boxShadow: '0 0 5px rgba(255, 215, 0, 0.3), 0 0 8px rgba(255, 215, 0, 0.2)',
                        },
                        '50%': {
                          boxShadow: '0 0 8px rgba(255, 215, 0, 0.5), 0 0 12px rgba(255, 215, 0, 0.3)',
                        },
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={video.thumbnail || 'https://via.placeholder.com/400x225/ff6b6b/ffffff?text=Video'}
                      alt={video.title}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        }
                      }}
                    />
                    
                    {/* Duration Badge */}
                    {video.duration && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: 1,
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {video.duration}
                      </Box>
                    )}

                    {/* Play Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        '&:hover': {
                          opacity: 1,
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: 'scale(0.8)',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1)',
                          }
                        }}
                      >
                        <Box
                          component="svg"
                          sx={{
                            width: 24,
                            height: 24,
                            fill: '#000',
                          }}
                        >
                          <path d="M8 5v14l11-7z" />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          )}
      </Box>
    </Box>
    </>
  );
};

export default Home;

