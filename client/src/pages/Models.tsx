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
import { Person, Search, Visibility, Videocam } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { modelService, videoService } from '../services/database';
import { Model, Video } from '../lib/supabase';
import { motion } from 'motion/react';
import SEO from '../components/SEO/SEO';
import { toast } from 'react-hot-toast';

interface ModelData {
  id?: string;
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

  // Helper function to manually mark a model as trans (for existing models)
  // This can be called from browser console: window.markModelAsTrans('Model Name')
  useEffect(() => {
    (window as any).markModelAsTrans = (modelName: string) => {
      const model = models.find(m => m.name === modelName);
      if (model && model.id) {
        const transModelIds = JSON.parse(localStorage.getItem('transModels') || '[]');
        if (!transModelIds.includes(model.id)) {
          transModelIds.push(model.id);
          localStorage.setItem('transModels', JSON.stringify(transModelIds));
          console.log('✅ Marked model as trans:', modelName, model.id);
          // Update the model in state
          setModels(prevModels => 
            prevModels.map(m => 
              m.name === modelName ? { ...m, is_trans: true } : m
            )
          );
          toast.success(`Model "${modelName}" marked as Trans!`);
        } else {
          console.log('⚠️ Model already marked as trans:', modelName);
          toast.success(`Model "${modelName}" is already marked as Trans!`);
        }
      } else {
        console.error('❌ Model not found:', modelName);
        toast.error(`Model "${modelName}" not found!`);
      }
    };
  }, [models]);

  // Helper function to manually mark a model as trans (for existing models)
  const markModelAsTrans = (modelName: string) => {
    const model = models.find(m => m.name === modelName);
    if (model && model.id) {
      const transModelIds = JSON.parse(localStorage.getItem('transModels') || '[]');
      if (!transModelIds.includes(model.id)) {
        transModelIds.push(model.id);
        localStorage.setItem('transModels', JSON.stringify(transModelIds));
        console.log('✅ Marked model as trans:', modelName, model.id);
        // Reload models to reflect the change
        window.location.reload();
      }
    }
  };

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
        
        // Load trans models from localStorage (since column doesn't exist in DB)
        const transModelIds = JSON.parse(localStorage.getItem('transModels') || '[]');
        console.log('🔍 Trans model IDs from localStorage:', transModelIds);
        
        const formattedModels: ModelData[] = modelsData.map(model => {
          // Count videos for this model
          const modelVideos = videos.filter(v => v.model_id === model.id);
          const totalViews = modelVideos.reduce((sum, v) => sum + (v.views || 0), 0);
          
          // Check if this model is marked as trans in localStorage
          const isTrans = transModelIds.includes(model.id) || model.is_trans === true;
          
          console.log('🔍 Model data:', {
            name: model.name,
            id: model.id,
            is_trans_from_db: model.is_trans,
            is_trans_from_localStorage: transModelIds.includes(model.id),
            final_is_trans: isTrans
          });
          
          return {
            id: model.id,
            name: model.name,
            image: model.image,
            is_trans: isTrans,
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
          // Ensure localStorage models have is_trans field and check transModelIds
          const localModelsWithTrans = localModels.map(model => ({
            ...model,
            is_trans: transModelIds.includes(model.id || '') || model.is_trans === true
          }));
          const mergedModels = [...localModelsWithTrans];
          formattedModels.forEach(model => {
            const existingModel = mergedModels.find(m => m.name === model.name);
            if (!existingModel) {
              // Ensure is_trans is always a boolean when pushing
              mergedModels.push({
                ...model,
                is_trans: transModelIds.includes(model.id || '') || model.is_trans === true
              });
            } else {
              // Update existing model with latest data from Supabase
              const index = mergedModels.indexOf(existingModel);
              mergedModels[index] = {
                ...mergedModels[index],
                id: model.id,
                name: model.name,
                image: model.image,
                is_trans: transModelIds.includes(model.id || '') || model.is_trans === true,
                viewCount: model.viewCount,
                videoCount: model.videoCount
              };
            }
          });
          console.log('✅ Models Page: Final merged models:', mergedModels.length);
          console.log('   Merged models data:', mergedModels.map(m => ({ name: m.name, is_trans: m.is_trans })));
          
          // Auto-mark "Jessy dubai" as trans if not already marked
          const jessyDubai = mergedModels.find(m => m.name.toLowerCase().includes('jessy') && m.name.toLowerCase().includes('dubai'));
          if (jessyDubai && jessyDubai.id && !transModelIds.includes(jessyDubai.id)) {
            transModelIds.push(jessyDubai.id);
            localStorage.setItem('transModels', JSON.stringify(transModelIds));
            console.log('✅ Auto-marked "Jessy dubai" as trans:', jessyDubai.id);
            // Update the model in mergedModels
            const jessyIndex = mergedModels.findIndex(m => m.id === jessyDubai.id);
            if (jessyIndex > -1) {
              mergedModels[jessyIndex] = { ...mergedModels[jessyIndex], is_trans: true };
            }
          }
          
          setModels(mergedModels);
          // Initial filter - show non-trans models by default
          const initialFiltered = mergedModels.filter(model => model.is_trans !== true);
          console.log('✅ Initial filtered models (non-trans):', initialFiltered.length);
          setFilteredModels(initialFiltered);
        } else {
          console.log('✅ Models Page: Using only Supabase models:', formattedModels.length);
          console.log('   Supabase models data:', formattedModels.map(m => ({ name: m.name, is_trans: m.is_trans })));
          
          // Auto-mark "Jessy dubai" as trans if not already marked
          const jessyDubai = formattedModels.find(m => m.name.toLowerCase().includes('jessy') && m.name.toLowerCase().includes('dubai'));
          if (jessyDubai && jessyDubai.id && !transModelIds.includes(jessyDubai.id)) {
            transModelIds.push(jessyDubai.id);
            localStorage.setItem('transModels', JSON.stringify(transModelIds));
            console.log('✅ Auto-marked "Jessy dubai" as trans:', jessyDubai.id);
            // Update the model in formattedModels
            const jessyIndex = formattedModels.findIndex(m => m.id === jessyDubai.id);
            if (jessyIndex > -1) {
              formattedModels[jessyIndex] = { ...formattedModels[jessyIndex], is_trans: true };
            }
          }
          
          setModels(formattedModels);
          // Initial filter - show non-trans models by default
          const initialFiltered = formattedModels.filter(model => model.is_trans !== true);
          console.log('✅ Initial filtered models (non-trans):', initialFiltered.length);
          setFilteredModels(initialFiltered);
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
          // Load trans models from localStorage (since column doesn't exist in DB)
          const fallbackTransModelIds = JSON.parse(localStorage.getItem('transModels') || '[]');
          const modelsData: ModelData[] = JSON.parse(savedModels);
          // Ensure is_trans field exists
          const modelsWithTrans = modelsData.map(model => ({
            ...model,
            is_trans: fallbackTransModelIds.includes(model.id || '') || model.is_trans === true
          }));
          // Also check transModelIds for localStorage models
          const modelsWithTransChecked = modelsWithTrans.map(model => ({
            ...model,
            is_trans: fallbackTransModelIds.includes(model.id || '') || model.is_trans === true
          }));
          console.log('✅ Models Page: localStorage models loaded:', modelsWithTransChecked.length);
          setModels(modelsWithTransChecked);
          // Initial filter - show non-trans models by default
          const initialFiltered = modelsWithTransChecked.filter(model => model.is_trans !== true);
          console.log('✅ Initial filtered models (non-trans):', initialFiltered.length);
          setFilteredModels(initialFiltered);
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
    let filtered = [...models]; // Create a copy
    
    console.log('🔍 Filtering models:', {
      totalModels: models.length,
      showTransModels,
      modelsData: models.map(m => ({ name: m.name, is_trans: m.is_trans }))
    });
    
    // Filter by trans status
    if (showTransModels) {
      // Show only trans models (is_trans === true)
      filtered = filtered.filter(model => {
        const isTrans = model.is_trans === true;
        if (isTrans) {
          console.log(`✅ Including trans model: ${model.name}`);
        }
        return isTrans;
      });
      console.log('✅ Trans models filtered:', filtered.length, 'out of', models.length);
    } else {
      // Show all models that are NOT trans
      // Include models where is_trans is false, undefined, null, or not set
      filtered = filtered.filter(model => {
        // Only exclude if is_trans is explicitly true
        const isTrans = model.is_trans === true;
        if (isTrans) {
          console.log(`❌ Excluding trans model: ${model.name} (is_trans=${model.is_trans})`);
        } else {
          console.log(`✅ Including normal model: ${model.name} (is_trans=${model.is_trans})`);
        }
        return !isTrans;
      });
      console.log('✅ Normal models filtered:', filtered.length, 'out of', models.length);
      console.log('   Filtered model names:', filtered.map(m => m.name));
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('✅ After search filter:', filtered.length);
    }
    
    console.log('✅ Final filtered models:', filtered.length, filtered.map(m => m.name));
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, maxWidth: 1200, mx: 'auto' }}>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="h3" component="h1" className="gradient-text">
              {showTransModels ? 'Trans Models' : 'Models'}
            </Typography>
          </Box>
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
                <Box
                  component="svg"
                  width="800px"
                  height="800px"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill={showTransModels ? '#ff6b6b' : 'currentColor'}
                  className="bi bi-gender-trans"
                  sx={{
                    width: 20,
                    height: 20,
                    color: showTransModels ? '#ff6b6b' : 'currentColor',
                  }}
                >
                  <path fillRule="evenodd" d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1.707L3.5 2.793l.646-.647a.5.5 0 1 1 .708.708l-.647.646.822.822A3.99 3.99 0 0 1 8 3c1.18 0 2.239.51 2.971 1.322L14.293 1H11.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-3.45 3.45A4 4 0 0 1 8.5 10.97V13H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V14H6a.5.5 0 0 1 0-1h1.5v-2.03a4 4 0 0 1-3.05-5.814l-.95-.949-.646.647a.5.5 0 1 1-.708-.708l.647-.646L1 1.707V3.5a.5.5 0 0 1-1 0v-3zm5.49 4.856a3 3 0 1 0 5.02 3.288 3 3 0 0 0-5.02-3.288z"/>
                </Box>
                <Typography variant="body2" sx={{ color: showTransModels ? '#ff6b6b' : 'inherit' }}>
                  Trans
                </Typography>
              </Box>
            }
            labelPlacement="start"
            sx={{
              '& .MuiFormControlLabel-root': {
                justifyContent: 'flex-start',
                gap: '0px',
              },
              '& .MuiFormControlLabel-label': {
                marginLeft: 0,
                marginRight: 1,
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
