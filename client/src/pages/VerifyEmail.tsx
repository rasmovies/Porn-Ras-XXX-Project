import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Home } from '@mui/icons-material';
import { motion } from 'motion/react';
import { useAuth } from '../components/Auth/AuthProvider';
import SEO from '../components/SEO/SEO';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const verifyEmail = async () => {
    try {
      // Backend'e verification isteği gönder
      const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? `${window.location.protocol}//${window.location.hostname}:5000` 
          : '');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Verification failed');
      }

      const data = await response.json();
      
      // Email doğrulandı, kullanıcıyı login yapma
      setStatus('success');
      setMessage('Your email has been verified successfully! You can now log in to your account.');
      
      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage(error.message || 'Verification failed. Please try again or request a new verification email.');
    }
  };

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    // Email doğrulama işlemi
    // Not: Backend'de doğrulama endpoint'i yoksa, sadece başarı mesajı göster
    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  return (
    <>
      <SEO
        title="Verify Email - PORNRAS"
        description="Verify your email address to complete your registration"
      />
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              {status === 'loading' && (
                <>
                  <CircularProgress sx={{ mb: 3, color: '#ff6b6b' }} />
                  <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', mb: 2 }}>
                    Verifying Your Email
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Please wait while we verify your email address...
                  </Typography>
                </>
              )}

              {status === 'success' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                  >
                    <CheckCircle
                      sx={{
                        fontSize: 80,
                        color: '#4ecdc4',
                        mb: 3,
                      }}
                    />
                  </motion.div>
                  <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', mb: 2 }}>
                    Email Verified!
                  </Typography>
                  <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    {message}
                  </Alert>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Redirecting to login page...
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Home />}
                    onClick={() => navigate('/login')}
                    sx={{
                      bgcolor: '#ff6b6b',
                      '&:hover': {
                        bgcolor: '#ff5252',
                      },
                    }}
                  >
                    Go to Login
                  </Button>
                </>
              )}

              {status === 'error' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                  >
                    <ErrorIcon
                      sx={{
                        fontSize: 80,
                        color: '#ff6b6b',
                        mb: 3,
                      }}
                    />
                  </motion.div>
                  <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', mb: 2 }}>
                    Verification Failed
                  </Typography>
                  <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                    {message}
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/register')}
                      sx={{
                        borderColor: '#ff6b6b',
                        color: '#ff6b6b',
                        '&:hover': {
                          borderColor: '#ff5252',
                          bgcolor: 'rgba(255, 107, 107, 0.1)',
                        },
                      }}
                    >
                      Register Again
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Home />}
                      onClick={() => navigate('/')}
                      sx={{
                        bgcolor: '#ff6b6b',
                        '&:hover': {
                          bgcolor: '#ff5252',
                        },
                      }}
                    >
                      Go Home
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </>
  );
};

export default VerifyEmail;

