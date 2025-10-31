import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack, Person, PlayArrow, Visibility } from '@mui/icons-material';
import { Model, Video } from '../lib/supabase';
import { modelService, videoService } from '../services/database';

const ModelProfile: React.FC = () => {
  const { modelName } = useParams<{ modelName: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<Model | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModelData();
  }, [modelName]);

  const loadModelData = async () => {
    try {
      setLoading(true);
      
      // Load all models and find the matching one
      const allModels = await modelService.getAll();
      const foundModel = allModels.find(m => 
        m.name.toLowerCase().replace(/\s+/g, '-') === modelName?.toLowerCase()
      );
      
      if (foundModel) {
        setModel(foundModel);
        
        // Load videos for this model
        try {
          const allVideos = await videoService.getAll();
          const modelVideos = allVideos.filter(v => v.model_id === foundModel.id);
          setVideos(modelVideos);
        } catch (error) {
          console.error('Failed to load videos:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load model:', error);
      // Fallback to localStorage
      const savedModels = localStorage.getItem('adminModels');
      if (savedModels) {
        const parsed = JSON.parse(savedModels);
        const foundModel = parsed.find((m: any) => 
          m.name.toLowerCase().replace(/\s+/g, '-') === modelName?.toLowerCase()
        );
        if (foundModel) {
          setModel(foundModel);
        }
      }
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

  if (!model) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom>
            Model Not Found
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/models')}
          >
            Back to Models
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <IconButton
        onClick={() => navigate('/models')}
        sx={{ mb: 3 }}
      >
        <ArrowBack />
      </IconButton>

      {/* Model Header */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        gap: 4, 
        alignItems: 'flex-start',
        bgcolor: 'rgba(255,255,255,0.03)',
        borderRadius: 4,
        padding: 4,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Model Avatar */}
        <Box>
          {model.image ? (
            <Box
              component="img"
              src={model.image}
              alt={model.name}
              sx={{
                maxWidth: 280,
                width: 'auto',
                height: 'auto',
                maxHeight: 400,
                border: '4px solid rgba(255,107,107,0.5)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(255,107,107,0.3)',
                display: 'block',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 250,
                height: 350,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,107,107,0.2)',
                border: '4px solid rgba(255,107,107,0.5)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(255,107,107,0.3)',
              }}
            >
              <Person sx={{ fontSize: 120 }} />
            </Box>
          )}
        </Box>

        {/* Model Info */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
            {model.name.toUpperCase()}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Chip
              label={`${videos.length} Videos`}
              sx={{
                bgcolor: 'rgba(255,107,107,0.2)',
                color: '#ff6b6b',
                border: '1px solid rgba(255,107,107,0.3)',
                fontSize: '1rem',
                padding: '8px 16px',
                height: 'auto',
              }}
            />
          </Box>

          {/* Tags */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
              TAGS
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['Featured', 'Popular', 'Premium'].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Videos Section */}
      {videos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            No videos found for this model
          </Typography>
        </Box>
      ) : (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'white' }}>
            Videos
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
            {videos.map((video) => (
              <Box key={video.id}>
                <Card
                  onClick={() => handleVideoClick(video.id)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: 'rgba(255,107,107,0.3)',
                      boxShadow: '0 8px 32px rgba(255,107,107,0.2)',
                    },
                  }}
                >
                  <CardMedia
                    sx={{
                      height: 200,
                      position: 'relative',
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
                        <PlayArrow sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)' }} />
                      </Box>
                    )}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 1,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption">
                        {video.duration || 'N/A'}
                      </Typography>
                    </Box>
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {video.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Visibility sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {video.views || 0}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(video.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default ModelProfile;

