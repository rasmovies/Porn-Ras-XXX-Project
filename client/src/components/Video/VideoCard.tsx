import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box } from '@mui/material';
import { PlayArrow, AccessTime } from '@mui/icons-material';
import { motion } from 'motion/react';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    views: number;
    duration: string;
    category: string;
    uploadDate: string;
  };
  onClick?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatUploadDate = (date: string) => {
    const uploadDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - uploadDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="video-card component-card"
        onClick={onClick}
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'box-shadow 0.3s ease',
          position: 'relative',
          '&:hover': {
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            '& .video-title': {
              opacity: 1
            },
            '& .video-title-overlay': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      >
      <Box className="video-thumbnail" sx={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.1)' }}>
        <CardMedia
          component="img"
          image={video.thumbnail}
          alt={video.title}
          sx={{ 
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        />
        
        {/* Duration Badge */}
        <Box 
          className="video-duration"
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
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <AccessTime sx={{ fontSize: 14 }} />
          {video.duration}
        </Box>

        {/* Play Overlay */}
        <motion.div
          className="video-overlay"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <PlayArrow sx={{ fontSize: 48, color: 'white' }} />
          </motion.div>
        </motion.div>
      </Box>

      <CardContent 
        className="video-info" 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          p: 2, 
          bgcolor: 'rgba(26, 26, 26, 1)',
          position: 'relative',
          overflow: 'visible',
          minHeight: '60px',
          justifyContent: 'center',
          '& .MuiTypography-root': {
            color: '#ffffff !important'
          }
        }}
      >
        <Box
          sx={{
            width: '100%',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 600,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
            opacity: 1,
            visibility: 'visible'
          }}
          className="video-title"
        >
          {video.title || 'Untitled Video'}
        </Box>
      </CardContent>
      
      {/* Hover Title Overlay - Shows on card hover */}
      <Box
        className="video-title-overlay"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          p: 1.5,
          opacity: 0,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: 'none',
          zIndex: 100,
          transform: 'translateY(100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
            textAlign: 'center'
          }}
        >
          {video.title}
        </Typography>
      </Box>
    </Card>
    </motion.div>
  );
};

export default VideoCard;
