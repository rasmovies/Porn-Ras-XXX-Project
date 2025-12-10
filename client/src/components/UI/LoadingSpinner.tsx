import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 40, 
  message = 'Loading...', 
  fullScreen = false 
}) => {
  const spinnerContent = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 2,
      p: 4
    }}>
      <CircularProgress 
        size={size} 
        sx={{ 
          color: '#ff6b6b',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }} 
      />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        {spinnerContent}
      </Box>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
