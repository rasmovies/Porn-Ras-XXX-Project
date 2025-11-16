import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { ArrowForwardIos, ArrowBackIos } from '@mui/icons-material';

interface Category {
  id: string;
  name: string;
  thumbnail: string;
  videoCount: number;
}

interface CategorySliderProps {
  categories: Category[];
  onCategoryClick?: (category: Category) => void;
}

const CategorySlider: React.FC<CategorySliderProps> = ({ categories, onCategoryClick }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Box className="category-slider" sx={{ position: 'relative', mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom className="animate-fade-in-up">
        Categories
      </Typography>
      
      <Box sx={{ position: 'relative', px: 6 }}>
        {/* Left Arrow */}
        <IconButton
          onClick={scrollLeft}
          sx={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            background: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            width: 36,
            height: 36,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.5)',
              transform: 'translateY(-50%) scale(1.05)',
            }
          }}
        >
          <ArrowBackIos sx={{ fontSize: 16 }} />
        </IconButton>

        {/* Right Arrow */}
        <IconButton
          onClick={scrollRight}
          sx={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            background: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            width: 36,
            height: 36,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.5)',
              transform: 'translateY(-50%) scale(1.05)',
            }
          }}
        >
          <ArrowForwardIos sx={{ fontSize: 16 }} />
        </IconButton>

        {/* Categories Container */}
        <Box
          ref={scrollContainerRef}
          className="category-slider-container"
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            pb: 2,
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 120
          }}
        >
          {categories.map((category, index) => (
            <Card
              key={category.id}
              className="category-item"
              onClick={() => onCategoryClick?.(category)}
              sx={{
                minWidth: 200,
                maxWidth: 200,
                height: 120,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 2,
                bgcolor: 'transparent',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: '0 12px 30px rgba(102, 126, 234, 0.4)',
                }
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
                    borderRadius: 2,
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                />
              )}
              
              {/* Gradient overlay for better text readability */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)',
                  zIndex: 1,
                }}
              />
              
              <CardContent sx={{ 
                p: 2, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                height: '100%',
                position: 'relative',
                zIndex: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.1rem', textShadow: '2px 2px 8px rgba(0,0,0,1)', color: 'white' }}>
                  {category.name}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', textShadow: '1px 1px 4px rgba(0,0,0,1)', color: 'white', fontWeight: 500 }}>
                  {category.videoCount} videos
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default CategorySlider;
