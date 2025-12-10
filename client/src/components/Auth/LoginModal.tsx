import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Link,
  Alert,
  IconButton,
  TextField,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthProvider';
import { emailApi } from '../../services/emailApi';
import { authApi } from '../../services/authApi';
import toast from 'react-hot-toast';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSwitchToRegister, onLoginSuccess }) => {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    emailOrNickname: '',
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.emailOrNickname) {
      setError('Please enter your email or nickname');
      return;
    }
    
    try {
      // Login with email or nickname
      const userData = await authApi.loginWithEmailOrNickname(formData.emailOrNickname.trim());
      
      if (!userData) {
        throw new Error('Login failed - user data not returned');
      }
      
      // Create user object for AuthProvider
      const user = {
        username: userData.username,
        email: userData.email || null,
        name: userData.username,
        id: userData.id,
      };
      
      login(user);
      toast.success(`Welcome back, ${userData.username}!`);
      onClose();
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Invalid email or nickname. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

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
        onClose();
        
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } catch (error: any) {
        console.error('Google login error:', error);
        setError('Google login failed. Please try again.');
        toast.error('Google login failed');
      }
    },
    onError: (error) => {
      console.error('❌ Google login error:', error);
      setError('Google login was cancelled or failed');
      toast.error('Google login failed');
    },
  });

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background: 'transparent',
              boxShadow: 'none',
              maxHeight: '90vh',
              overflow: 'visible',
            }
          }}
          BackdropProps={{
            sx: {
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(20px)',
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <DialogContent sx={{ p: 0, position: 'relative' }}>
              {/* Close Button */}
              <IconButton
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 10,
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.7)',
                  }
                }}
              >
                <Close />
              </IconButton>

              {/* Login Form */}
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

                {!showForm ? (
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
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setShowForm(true)}
                      sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '1rem',
                        mt: 1,
                        '&:hover': {
                          border: '1px solid rgba(0, 255, 255, 0.5)',
                          background: 'rgba(0, 255, 255, 0.1)',
                        }
                      }}
                    >
                      Continue with Email
                    </Button>
                  </Box>
                ) : (
                  <Box component="form" onSubmit={handleFormSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <TextField
                      fullWidth
                      label="Email or Nickname"
                      name="emailOrNickname"
                      type="text"
                      value={formData.emailOrNickname}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter your email or nickname"
                      helperText="You can login with your email address or nickname"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(0, 255, 255, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00ffff',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        bgcolor: '#00ffff',
                        color: '#000',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        '&:hover': {
                          bgcolor: '#00cccc',
                        }
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setShowForm(false);
                        setError('');
                        setFormData({ emailOrNickname: '' });
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
                      Back
                    </Button>
                  </Box>
                )}

                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
                      New here?{' '}
                      <Link
                        component="button"
                        onClick={onSwitchToRegister}
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
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;


