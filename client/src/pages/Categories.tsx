import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import { VideoLibrary, Search } from '@mui/icons-material';
import { Category, Video } from '../lib/supabase';
import { categoryService, videoService } from '../services/database';
import { motion } from 'motion/react';
import SEO from '../components/SEO/SEO';

interface CategoryWithVideoCount extends Category {
  videoCount: number;
  click_count?: number;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithVideoCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // Load categories and videos from Supabase
      const [categoriesData, videosData] = await Promise.all([
        categoryService.getAll(),
        videoService.getAll()
      ]);
      
      // Count videos per category
      const categoriesWithCounts: CategoryWithVideoCount[] = categoriesData.map(category => {
        const videoCount = videosData.filter(v => v.category_id === category.id).length;
        return {
          ...category,
          videoCount,
          click_count: category.click_count || 0
        };
      });
      
      // Sort by click count (most popular first), then by video count as secondary sort
      categoriesWithCounts.sort((a, b) => {
        const clickDiff = (b.click_count || 0) - (a.click_count || 0);
        if (clickDiff !== 0) return clickDiff;
        return b.videoCount - a.videoCount;
      });
      
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Failed to load categories from Supabase:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (category: CategoryWithVideoCount) => {
    try {
      // Increment click count
      await categoryService.incrementClickCount(category.id);
      
      // Update local state to reflect the increment (optional, for immediate UI update)
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === category.id 
            ? { ...cat, click_count: (cat.click_count || 0) + 1 }
            : cat
        )
      );
    } catch (error) {
      console.error('Failed to increment click count:', error);
      // Still navigate even if click count fails
    }
    
    const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/categories/${categorySlug}`);
  };

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get most popular categories (top 8)
  const mostPopularCategories = filteredCategories.slice(0, 8);
  const allCategories = filteredCategories;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 4 }}>
      {/* Search Bar */}
      <Box sx={{ textAlign: 'center', mb: 6, px: 2 }}>
        <TextField
          fullWidth
          placeholder="Search Categories"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'rgba(255,255,255,0.7)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 600,
            mx: 'auto',
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.05)',
              color: 'white',
              borderRadius: '8px',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#ff6b6b',
              },
            },
          }}
        />
      </Box>

      {/* Most Popular Categories */}
      {mostPopularCategories.length > 0 && (
        <Box sx={{ mb: 6, px: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
            Most Popular Porn Categories
          </Typography>
          <Box
            className="category-grid category-grid--popular media-grid"
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: 'repeat(2, minmax(0, 1fr))', 
                sm: 'repeat(3, 1fr)', 
                md: 'repeat(4, 1fr)',
                lg: 'repeat(4, 1fr)'
              }, 
              gap: 2 
            }}
          >
            {mostPopularCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
              >
                <Card
                  onClick={() => handleCategoryClick(category)}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'transparent',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.5)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '133.33%', // 3:4 aspect ratio
                      overflow: 'hidden',
                      bgcolor: 'rgba(0,0,0,0.1)',
                    }}
                  >
                    {category.thumbnail ? (
                      <Box
                        component="img"
                        src={category.thumbnail}
                        alt={category.name}
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
                          bgcolor: 'rgba(102, 126, 234, 0.2)',
                        }}
                      >
                        <VideoLibrary sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)' }} />
                      </Box>
                    )}
                  </Box>

                  {/* Category Info */}
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        mb: 1,
                        fontSize: '16px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {category.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '14px',
                      }}
                    >
                      {formatNumber(category.videoCount)} Videos
                    </Typography>
                  </Box>
                </Card>
              </motion.div>
            ))}
          </Box>
        </Box>
      )}

      {/* All Categories */}
      {allCategories.length > 0 && (
        <Box sx={{ px: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
            All Porn Categories
          </Typography>
          <Box
            className="category-grid media-grid"
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: 'repeat(2, minmax(0, 1fr))', 
                sm: 'repeat(3, 1fr)', 
                md: 'repeat(4, 1fr)',
                lg: 'repeat(4, 1fr)'
              }, 
              gap: 2 
            }}
          >
            {allCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: (mostPopularCategories.length + index) * 0.05,
                  ease: "easeOut"
                }}
              >
                <Card
                  onClick={() => handleCategoryClick(category)}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'transparent',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.5)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '133.33%', // 3:4 aspect ratio
                      overflow: 'hidden',
                      bgcolor: 'rgba(0,0,0,0.1)',
                    }}
                  >
                    {category.thumbnail ? (
                      <Box
                        component="img"
                        src={category.thumbnail}
                        alt={category.name}
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
                          bgcolor: 'rgba(102, 126, 234, 0.2)',
                        }}
                      >
                        <VideoLibrary sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)' }} />
                      </Box>
                    )}
                  </Box>

                  {/* Category Info */}
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        mb: 1,
                        fontSize: '16px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {category.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '14px',
                      }}
                    >
                      {formatNumber(category.videoCount)} Videos
                    </Typography>
                  </Box>
                </Card>
              </motion.div>
            ))}
          </Box>
        </Box>
      )}

      {filteredCategories.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {searchTerm ? 'No categories found matching your search.' : 'No categories found.'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Categories;

