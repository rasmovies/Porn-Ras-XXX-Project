import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Person, Search, Visibility, Videocam, VpnKey } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { modelService, videoService } from '../services/database';
import { Model, Video } from '../lib/supabase';
import { motion } from 'motion/react';
import SEO from '../components/SEO/SEO';

interface ModelData {
  name: string;
  image: string | null;
  is_trans?: boolean;
  viewCount?: number;
  videoCount?: number;
}

const Models: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<ModelData[]>([]);
  const [filteredModels, setFilteredModels] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransModels, setShowTransModels] = useState(false);

  useEffect(() => {
    // Load models from both Supabase and localStorage
    const loadModels = async () => {
      try {
        setLoading(true);
        console.log('🔍 Models Page: Loading models...');
        console.log('🔍 Models Page: Environment:', process.env.NODE_ENV);
        console.log('🔍 Models Page: Supabase URL from ENV:', !!process.env.REACT_APP_SUPABASE_URL);
        
        // Load videos to count per model
        let videos: Video[] = [];
        try {
          console.log('🔍 Models Page: Loading videos...');
          videos = await videoService.getAll();
          console.log('✅ Models Page: Videos loaded:', videos.length);
        } catch (error: any) {
          console.error('❌ Models Page: Failed to load videos:', error);
          console.error('   Error details:', {
            message: error.message,
            code: error.code
          });
        }
        
        // First try to load from Supabase
        console.log('🔍 Models Page: Loading models from Supabase...');
        const modelsData = await modelService.getAll();
        console.log('✅ Models Page: Models from Supabase:', modelsData.length);
        console.log('   Models:', modelsData.map(m => m.name));
        
        const formattedModels: ModelData[] = modelsData.map(model => {
          // Count videos for this model
          const modelVideos = videos.filter(v => v.model_id === model.id);
          const totalViews = modelVideos.reduce((sum, v) => sum + (v.views || 0), 0);
          
          return {
            name: model.name,
            image: model.image,
            is_trans: model.is_trans || false,
            viewCount: totalViews,
            videoCount: modelVideos.length
          };
        });
        
        console.log('✅ Models Page: Formatted models:', formattedModels.length);
        
        // Then merge with localStorage data
        const savedModels = localStorage.getItem('adminModels');
        console.log('🔍 Models Page: localStorage check:', savedModels ? 'Has data' : 'Empty');
        
        if (savedModels) {
          const localModels: ModelData[] = JSON.parse(savedModels);
          console.log('✅ Models Page: localStorage models:', localModels.length);
          // Merge Supabase and localStorage models, removing duplicates
          const mergedModels = [...localModels];
          formattedModels.forEach(model => {
            if (!mergedModels.find(m => m.name === model.name)) {
              mergedModels.push(model);
            }
          });
          console.log('✅ Models Page: Final merged models:', mergedModels.length);
          setModels(mergedModels);
          setFilteredModels(mergedModels);
        } else {
          console.log('✅ Models Page: Using only Supabase models:', formattedModels.length);
          setModels(formattedModels);
          setFilteredModels(formattedModels);
        }
      } catch (error: any) {
        console.error('❌ Models Page: Failed to load models:', error);
        console.error('   Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        // Fallback to localStorage if Supabase fails
        const savedModels = localStorage.getItem('adminModels');
        if (savedModels) {
          console.log('⚠️ Models Page: Using localStorage fallback');
          const modelsData: ModelData[] = JSON.parse(savedModels);
          console.log('✅ Models Page: localStorage models loaded:', modelsData.length);
          setModels(modelsData);
          setFilteredModels(modelsData);
        } else {
          console.log('❌ Models Page: No models found in Supabase or localStorage');
          setModels([]);
          setFilteredModels([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    // Filter models based on search term and trans filter
    let filtered = models;
    
    // Filter by trans status
    if (showTransModels) {
      filtered = filtered.filter(model => model.is_trans === true);
    } else {
      filtered = filtered.filter(model => model.is_trans !== true);
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredModels(filtered);
  }, [searchTerm, models, showTransModels]);

  const handleModelClick = (modelName: string) => {
    const slug = modelName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/models/${slug}`);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`.replace(/\.00/, '');
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`.replace(/\.0/, '');
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (loading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center', width: '100%' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading models...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h3" component="h1" className="gradient-text">
            {showTransModels ? 'Trans Models' : 'Models'}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={showTransModels}
                onChange={(e) => setShowTransModels(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#ff6b6b',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#ff6b6b',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VpnKey sx={{ fontSize: 20, color: showTransModels ? '#ff6b6b' : 'inherit' }} />
                <Typography variant="body2" sx={{ color: showTransModels ? '#ff6b6b' : 'inherit' }}>
                  Trans
                </Typography>
              </Box>
            }
            sx={{
              ml: 2,
              '& .MuiFormControlLabel-label': {
                marginLeft: 1,
              }
            }}
          />
        </Box>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          {showTransModels 
            ? 'Discover our talented trans models and their amazing content'
            : 'Discover our talented models and their amazing content'}
        </Typography>
        
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search models..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ 
            maxWidth: 500, 
            mx: 'auto',
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
            }
          }}
        />
      </Box>

      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
            {searchTerm ? 'No models found matching your search.' : 'No models found. Add some models in the admin panel.'}
          </Alert>
        </Box>
      ) : (
        <Box
          className="model-grid media-grid"
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: 'repeat(2, minmax(0, 1fr))', 
              sm: 'repeat(3, 1fr)', 
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)',
              xl: 'repeat(6, 1fr)'
            }, 
            gap: 1,
            width: '100%'
          }}
        >
          {filteredModels.map((model, index) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.05,
                ease: "easeOut"
              }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              style={{ cursor: 'pointer' }}
              onClick={() => handleModelClick(model.name)}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '3/4', // Portrait aspect ratio
                  overflow: 'hidden',
                  borderRadius: 0,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  }
                }}
              >
                {/* Model Image */}
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
                        transform: 'scale(1.05)',
                      }
                    }}
                    onError={(e) => {
                      console.error('Model image load error:', e);
                      e.currentTarget.style.display = 'none';
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
                      bgcolor: 'rgba(102, 126, 234, 0.2)'
                    }}
                  >
                    <Person sx={{ fontSize: 60, color: 'rgba(255,255,255,0.9)' }} />
                  </Box>
                )}

                {/* Overlay at bottom with stats */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
                    padding: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  {/* Left side - Views */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Visibility sx={{ fontSize: 16, color: 'white' }} />
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                      {formatNumber(model.viewCount || 0)}
                    </Typography>
                  </Box>

                  {/* Right side - Videos */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Videocam sx={{ fontSize: 16, color: 'white' }} />
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                      {model.videoCount || 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Model Name */}
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  color: '#ff6b6b', 
                  fontWeight: 'bold',
                  mt: 1,
                  textAlign: 'center',
                  fontSize: '16px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {model.name}
              </Typography>
            </motion.div>
          ))}
        </Box>
      )}

      {/* Admin Panel Link */}
      {models.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/admin')}
            startIcon={<Person />}
            size="large"
          >
            Go to Admin Panel
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Models;
