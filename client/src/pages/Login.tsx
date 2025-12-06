import React, { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Link,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../components/Auth/AuthProvider';
import { emailApi } from '../services/emailApi';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
        setError('Google Client ID is not configured. Please contact administrator.');
        toast.error('Google Sign-In is not configured');
        return;
      }
      try {
        // Google'dan kullanıcı bilgilerini al
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        
        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info');
        }
        
        const userInfo = await userInfoResponse.json();
        
        // Kullanıcıyı sisteme kaydet/giriş yap
        const userData = {
          username: userInfo.email.split('@')[0] || userInfo.name.toLowerCase().replace(/\s+/g, '_'),
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.picture,
          googleId: userInfo.sub,
        };
        
        // Welcome email gönder
        try {
          await emailApi.sendWelcomeEmail({
            email: userInfo.email,
            name: userInfo.name,
          });
          console.log('✅ Welcome email sent');
        } catch (emailError) {
          console.error('⚠️ Welcome email gönderilemedi:', emailError);
          // Email hatası login'i engellemez
        }
        
        login(userData);
        toast.success(`Welcome, ${userInfo.name}!`);
        navigate('/');
      } catch (error: any) {
        console.error('Google login error:', error);
        setError('Google login failed. Please try again.');
        toast.error('Google login failed');
      }
    },
    onError: () => {
      setError('Google login was cancelled or failed');
      toast.error('Google login failed');
    },
  });

  return (
    <Box
      sx={{
        height: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 0,
        margin: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
          `,
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box
          sx={{
            width: { xs: '95%', sm: '90%', md: '400px' },
            maxWidth: '400px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: '20px',
                zIndex: -1,
              }
            }}
          >
            {/* Lightning Icon */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography
                variant="h3"
                sx={{
                  color: '#00ffff',
                  textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff',
                  fontWeight: 'bold',
                  mb: 0.5
                }}
              >
                ⚡
              </Typography>
            </Box>

            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              align="center"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                mb: 1,
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
              }}
            >
              Sign In
            </Typography>
            
            <Typography
              variant="body1"
              align="center"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                mb: 3,
                fontSize: '1.1rem'
              }}
            >
              Access your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                variant="outlined"
                fullWidth
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
                    setError('Google Sign-In is not configured. Please add REACT_APP_GOOGLE_CLIENT_ID to .env file.');
                    toast.error('Google Sign-In is not configured');
                    return;
                  }
                  handleGoogleLogin();
                }}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  '&:hover': {
                    border: '1px solid rgba(0, 255, 255, 0.5)',
                    background: 'rgba(0, 255, 255, 0.1)',
                  }
                }}
              >
                Continue with Google
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  '&:hover': {
                    border: '1px solid rgba(0, 255, 255, 0.5)',
                    background: 'rgba(0, 255, 255, 0.1)',
                  }
                }}
              >
                Continue with Apple
              </Button>
            </Box>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
                  New here?{' '}
                  <Link
                    component="button"
                    onClick={() => navigate('/register')}
                    sx={{
                      color: '#00ffff',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      '&:hover': {
                        textShadow: '0 0 10px #00ffff',
                      }
                    }}
                  >
                    Create an account
                  </Link>
                </Typography>
              </Box>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};

export default Login;
