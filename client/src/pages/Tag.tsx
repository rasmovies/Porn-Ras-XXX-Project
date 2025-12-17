import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Chip } from '@mui/material';
import { motion } from 'motion/react';
import { videoService } from '../services/database';
import { Video } from '../lib/supabase';
import SEO from '../components/SEO/SEO';
import VideoCard from '../components/Video/VideoCard';

const Tag: React.FC = () => {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const decodedTagName = tagName ? decodeURIComponent(tagName) : '';

  useEffect(() => {
    const loadVideosByTag = async () => {
      if (!decodedTagName) return;
      
      try {
        setLoading(true);
        const allVideos = await videoService.getAll();
        
        // Filter videos by tag (case-insensitive)
        const tagVideos = allVideos.filter(video => {
          if (!video.tags) return false;
          const tags = video.tags.split(',').map(t => t.trim().toLowerCase());
          return tags.includes(decodedTagName.toLowerCase());
        });
        
        setVideos(tagVideos);
      } catch (error) {
        console.error('Failed to load videos by tag:', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadVideosByTag();
  }, [decodedTagName]);

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  return (
    <>
      <SEO
        title={`${decodedTagName} - Tag Videos`}
        description={`Watch videos tagged with ${decodedTagName}`}
        url={`/tag/${tagName}`}
        type="website"
      />
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                mb: 2
              }}
            >
              Tag: {decodedTagName}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {videos.length} {videos.length === 1 ? 'video' : 'videos'} found
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : videos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No videos found with this tag
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
                gap: 2,
                width: '100%'
              }}
            >
              {videos.map((video) => {
                // Convert Video to VideoCard format
                const videoCardData = {
                  id: video.id,
                  title: video.title,
                  thumbnail: video.thumbnail || '',
                  views: video.views || 0,
                  duration: video.duration || '0:00',
                  category: 'Uncategorized',
                  uploadDate: video.created_at || new Date().toISOString()
                };
                
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: videos.indexOf(video) * 0.1,
                      ease: "easeOut"
                    }}
                    onClick={() => handleVideoClick(video.slug || video.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <VideoCard video={videoCardData} />
                  </motion.div>
                );
              })}
            </Box>
          )}
        </motion.div>
      </Container>
    </>
  );
};

export default Tag;

