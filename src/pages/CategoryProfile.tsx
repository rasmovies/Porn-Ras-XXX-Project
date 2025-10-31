import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CircularProgress,
  Button,
  IconButton,
} from '@mui/material';
import { ArrowBack, VideoLibrary } from '@mui/icons-material';
import { Category, Video } from '../lib/supabase';
import { categoryService, videoService } from '../services/database';

const CategoryProfile: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryData();
  }, [categoryName]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      
      // Load category from Supabase by name
      const categories = await categoryService.getAll();
      const categoryData = categories.find(cat => 
        cat.name.toLowerCase().replace(/\s+/g, '-') === categoryName
      );
      
      if (categoryData) {
        setCategory(categoryData);
        
        // Load videos for this category
        const allVideos = await videoService.getAll();
        const categoryVideos = allVideos.filter(video => video.category_id === categoryData.id);
        setVideos(categoryVideos);
      }
    } catch (error) {
      console.error('Failed to load category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!category) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            Category Not Found
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            The category you're looking for doesn't exist.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/categories')}
          >
            Back to Categories
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/categories')}
          sx={{ color: 'white', mb: 2 }}
        >
          Back to Categories
        </Button>
      </Box>

      {/* Category Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        {category.thumbnail && (
          <Box
            sx={{
              width: 200,
              height: 200,
              margin: '0 auto',
              mb: 3,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src={category.thumbnail}
              alt={category.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
        )}
        <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          {category.name}
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {videos.length} {videos.length === 1 ? 'video' : 'videos'} available
        </Typography>
      </Box>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <VideoLibrary sx={{ fontSize: 80, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            No videos found in this category
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
          {videos.map((video) => (
            <Card
              key={video.id}
              onClick={() => handleVideoClick(video.id)}
              sx={{
                cursor: 'pointer',
                bgcolor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  borderColor: 'rgba(255,107,107,0.3)',
                  boxShadow: '0 20px 60px rgba(255,107,107,0.2)',
                },
              }}
            >
              <CardMedia
                sx={{
                  height: 180,
                  bgcolor: 'rgba(255,255,255,0.05)',
                }}
              >
                {video.thumbnail ? (
                  <Box
                    component="img"
                    src={video.thumbnail}
                    alt={video.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <VideoLibrary sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)' }} />
                  </Box>
                )}
              </CardMedia>
              <Box sx={{ p: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mb: 1,
                  }}
                >
                  {video.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {video.views} views
                </Typography>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default CategoryProfile;




