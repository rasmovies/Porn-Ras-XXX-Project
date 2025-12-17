import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, CircularProgress } from '@mui/material';
import { motion } from 'motion/react';
import { settingsService, videoService, modelService, channelService } from '../services/database';
import { Video, Model, Channel } from '../lib/supabase';
import SEO from '../components/SEO/SEO';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [heroTitle, setHeroTitle] = useState<string>('');
  const [heroSubtitle, setHeroSubtitle] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);
  const [topModels, setTopModels] = useState<Array<Model & { videoCount: number }>>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [herlimitVideos, setHerlimitVideos] = useState<Video[]>([]);
  const [loadingHerlimit, setLoadingHerlimit] = useState(true);

  // Load videos from Supabase
  useEffect(() => {
    const loadVideos = async () => {
      setLoadingVideos(true);
      try {
        console.log('🔍 Home: Loading videos from Supabase...');
        const videos = await videoService.getAll();
        console.log('✅ Home: Videos loaded:', videos.length);
        setAllVideos(videos);
      } catch (error: any) {
        console.error('❌ Home: Failed to load videos:', error);
        console.error('   Error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        // Set empty array on error to prevent crash
        setAllVideos([]);
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

  // Load top models with video counts
  useEffect(() => {
    const loadTopModels = async () => {
      setLoadingModels(true);
      try {
        console.log('🔍 Home: Loading top models...');
        const models = await modelService.getAll();
        console.log('✅ Home: Models loaded:', models.length);
        
        // If no models loaded (possibly due to timeout), still try to show something
        if (models.length === 0) {
          console.warn('⚠️ Home: No models loaded, possibly due to timeout');
        }
        
        const videos = await videoService.getAll();
        console.log('✅ Home: Videos loaded:', videos.length);
        
        // Count videos per model
        const modelVideoCounts: Record<string, number> = {};
        let videosWithModelId = 0;
        videos.forEach(video => {
          if (video.model_id) {
            videosWithModelId++;
            modelVideoCounts[video.model_id] = (modelVideoCounts[video.model_id] || 0) + 1;
          }
        });
        console.log('📊 Home: Videos with model_id:', videosWithModelId);
        console.log('📊 Home: Model video counts:', modelVideoCounts);
        
        // Add video count to models and sort by video count
        // If no models have videos, show all models (with 0 video count)
        const modelsWithCounts = models
          .map(model => ({
            ...model,
            videoCount: modelVideoCounts[model.id] || 0
          }))
          .sort((a, b) => {
            // Sort by video count first, then by name if counts are equal
            if (b.videoCount !== a.videoCount) {
              return b.videoCount - a.videoCount;
            }
            return (a.name || '').localeCompare(b.name || '');
          })
          .slice(0, 10); // Top 10 models
        
        // If all models have 0 videos, still show them (don't filter)
        // Otherwise, only show models with videos
        const filteredModels = modelsWithCounts.some(m => m.videoCount > 0)
          ? modelsWithCounts.filter(model => model.videoCount > 0)
          : modelsWithCounts;
        
        console.log('✅ Home: Top models with counts:', filteredModels.length);
        console.log('📋 Home: Top models:', filteredModels.map(m => ({ name: m.name, videoCount: m.videoCount })));
        
        setTopModels(filteredModels);
      } catch (error) {
        console.error('❌ Home: Failed to load top models:', error);
        setTopModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    loadTopModels();
  }, []);

  // Auto-slide for TOP MODELS slider
  useEffect(() => {
    if (topModels.length === 0) return;
    
    // Show 6 models at a time, so we need to calculate how many slides
    const modelsPerSlide = 6;
    const totalSlides = Math.ceil(topModels.length / modelsPerSlide);
    
    if (totalSlides <= 1) return; // No need to slide if all models fit
    
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => {
        const nextIndex = prev + 1;
        // Loop back to start when reaching the end
        return nextIndex >= totalSlides ? 0 : nextIndex;
      });
    }, 3000); // Change slide every 3 seconds
    
    return () => clearInterval(interval);
  }, [topModels]);

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  const handleModelClick = (modelId: string) => {
    navigate(`/model/${modelId}`);
  };

  // Get viral videos (most viewed)
  const viralVideos = [...allVideos]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 12); // Top 12 most viewed videos

  // Load HERLIMIT videos from HERLIMIT channel
  useEffect(() => {
    const loadHerlimitVideos = async () => {
      setLoadingHerlimit(true);
      try {
        console.log('🔍 Home: Loading HERLIMIT videos...');
        // Get all channels and find HERLIMIT channel
        const channels = await channelService.getAll();
        const herlimitChannel = channels.find(
          c => c.name.toLowerCase() === 'herlimit'
        );
        
        if (herlimitChannel) {
          console.log('✅ Home: HERLIMIT channel found:', herlimitChannel.id);
          // Get all videos and filter by HERLIMIT channel
          const allVideos = await videoService.getAll();
          const herlimitVids = allVideos.filter(
            v => v.channel_id === herlimitChannel.id
          );
          console.log('✅ Home: HERLIMIT videos loaded:', herlimitVids.length);
          setHerlimitVideos(herlimitVids);
        } else {
          console.warn('⚠️ Home: HERLIMIT channel not found');
          setHerlimitVideos([]);
        }
      } catch (error) {
        console.error('❌ Home: Failed to load HERLIMIT videos:', error);
        setHerlimitVideos([]);
      } finally {
        setLoadingHerlimit(false);
      }
    };

    loadHerlimitVideos();
  }, []);

  // Check if HERLIMIT videos exist
  const hasHerlimitVideos = herlimitVideos.length > 0;

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
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: 'rgba(26, 26, 26, 1)',
                      '&:hover': {
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '56.25%', // 16:9 aspect ratio
                        overflow: 'hidden',
                        bgcolor: 'rgba(0,0,0,0.1)',
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
                    
                    {/* Video Title */}
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'rgba(26, 26, 26, 1)',
                        minHeight: '50px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          color: '#ffffff',
                          opacity: 1,
                          margin: 0,
                          width: '100%'
                        }}
                      >
                        {video.title || 'Untitled Video'}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          )}

        {/* Viral Videos Section */}
        <Box sx={{ width: '100%', mt: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2, px: 0, fontWeight: 'bold' }}>
            VIRAL VIDEOS
          </Typography>
          {loadingVideos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : viralVideos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No viral videos found
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
              {viralVideos.map((video, index) => (
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
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: 'rgba(26, 26, 26, 1)',
                      '&:hover': {
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '56.25%',
                        overflow: 'hidden',
                        bgcolor: 'rgba(0,0,0,0.1)',
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
                    
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'rgba(26, 26, 26, 1)',
                        minHeight: '50px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          color: '#ffffff',
                          opacity: 1,
                          margin: 0,
                          width: '100%'
                        }}
                      >
                        {video.title || 'Untitled Video'}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          )}
        </Box>

        {/* HERLIMIT VIDEOS Section - Only show if videos exist */}
        {hasHerlimitVideos && (
          <Box sx={{ width: '100%', mt: 6 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2, px: 0, fontWeight: 'bold' }}>
              HERLIMIT VIDEOS
            </Typography>
            {loadingHerlimit ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : herlimitVideos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No HERLIMIT videos found
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
                {herlimitVideos.map((video, index) => (
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
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'rgba(26, 26, 26, 1)',
                        '&:hover': {
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          paddingTop: '56.25%',
                          overflow: 'hidden',
                          bgcolor: 'rgba(0,0,0,0.1)',
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
                      
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: 'rgba(26, 26, 26, 1)',
                          minHeight: '50px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '14px',
                            fontWeight: 600,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            wordBreak: 'break-word',
                            color: '#ffffff',
                            opacity: 1,
                            margin: 0,
                            width: '100%'
                          }}
                        >
                          {video.title || 'Untitled Video'}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Top Models Section - Slider */}
        <Box sx={{ width: '100%', mt: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2, px: 0, fontWeight: 'bold' }}>
            TOP MODELS
          </Typography>
          {loadingModels ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : topModels.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No models found
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              {(() => {
                const modelsPerSlide = 6;
                const totalSlides = Math.ceil(topModels.length / modelsPerSlide);
                
                return (
                  <Box
                    component={motion.div}
                    sx={{
                      display: 'flex',
                      width: `${totalSlides * 100}%`,
                    }}
                    animate={{
                      x: `-${currentSlideIndex * 100}%`,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                      <Box
                        key={slideIndex}
                        sx={{
                          width: '100%',
                          minWidth: '100%',
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: 'repeat(2, minmax(0, 1fr))',
                            sm: 'repeat(3, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(6, 1fr)',
                          },
                          gap: 2,
                          flexShrink: 0,
                        }}
                      >
                      {topModels
                        .slice(slideIndex * modelsPerSlide, (slideIndex + 1) * modelsPerSlide)
                        .map((model, index) => (
                          <motion.div
                            key={model.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.5,
                              delay: index * 0.1,
                              ease: 'easeOut',
                            }}
                            whileHover={{
                              y: -8,
                              scale: 1.02,
                              transition: { duration: 0.2 },
                            }}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleModelClick(model.id)}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 2,
                                overflow: 'hidden',
                                bgcolor: 'rgba(26, 26, 26, 1)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                                  borderColor: 'rgba(180, 2, 2, 0.5)',
                                },
                              }}
                            >
                              {/* Model Image */}
                              <Box
                                sx={{
                                  position: 'relative',
                                  width: '100%',
                                  paddingTop: '133.33%', // 3:4 aspect ratio (portrait)
                                  overflow: 'hidden',
                                  bgcolor: 'rgba(0,0,0,0.2)',
                                }}
                              >
                                {model.image ? (
                                  <Box
                                    component="img"
                                    src={model.image}
                                    alt={model.name}
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
                                      },
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'rgba(180, 2, 2, 0.2)',
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: '48px',
                                        fontWeight: 700,
                                        color: 'rgba(255, 255, 255, 0.5)',
                                      }}
                                    >
                                      {model.name?.charAt(0) || 'M'}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              {/* Model Info */}
                              <Box
                                sx={{
                                  p: 1.5,
                                  bgcolor: 'rgba(26, 26, 26, 1)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#ffffff',
                                    textAlign: 'center',
                                    mb: 0.5,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%',
                                  }}
                                >
                                  {model.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '12px',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    textAlign: 'center',
                                  }}
                                >
                                  {model.videoCount} {model.videoCount === 1 ? 'video' : 'videos'}
                                </Typography>
                              </Box>
                            </Box>
                          </motion.div>
                        ))}
                      </Box>
                    ))}
                  </Box>
                );
              })()}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
    </>
  );
};

export default Home;

