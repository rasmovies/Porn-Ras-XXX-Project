import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from './Auth/AuthProvider';
import { adminUserService } from '../services/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireAdmin = false,
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Development mode'da authentication bypass (local test için)
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  useEffect(() => {
    const checkAdmin = async () => {
      // Development mode'da bypass
      if (isDevelopment) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }
      
      if (requireAdmin && user?.username) {
        try {
          const adminStatus = await adminUserService.isAdmin(user.username);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Failed to check admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkAdmin();
  }, [requireAdmin, user?.username, isDevelopment]);

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Checking access...
        </Typography>
      </Box>
    );
  }

  // Development mode'da bypass - direkt erişim izni ver
  if (isDevelopment) {
    return <>{children}</>;
  }

  // Require authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Require admin
  if (requireAdmin && (!isAuthenticated || !isAdmin)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

