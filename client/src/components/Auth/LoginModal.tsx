import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  TextField,
  Button,
  Link,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'motion/react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSwitchToRegister, onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    // Simulate login
    setError('');
    login({ username, name: username });
    onClose();
    // Call onLoginSuccess callback if provided
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  // Google Login handler - sadece Client ID varsa kullan
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  
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
  
  // Debug: Component render olduğunda log (sadece mount'ta)
  useEffect(() => {
    console.log('🔍 LoginModal mounted');
    console.log('🔍 REACT_APP_GOOGLE_CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('🔍 handleGoogleLogin type:', typeof handleGoogleLogin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  console.log('🔍 LoginModal render - handleGoogleLogin type:', typeof handleGoogleLogin);
  console.log('🔍 LoginModal render - REACT_APP_GOOGLE_CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');

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

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '&:hover': {
                          border: '1px solid rgba(0, 255, 255, 0.5)',
                          boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
                        },
                        '&.Mui-focused': {
                          border: '1px solid #00ffff',
                          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#00ffff',
                        }
                      }
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '&:hover': {
                          border: '1px solid rgba(0, 255, 255, 0.5)',
                          boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
                        },
                        '&.Mui-focused': {
                          border: '1px solid #00ffff',
                          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#00ffff',
                        }
                      }
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-checked': {
                              color: '#00ffff',
                            }
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                          Keep me signed in
                        </Typography>
                      }
                    />
                    <Link
                      href="#"
                      sx={{
                        color: '#00ffff',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        '&:hover': {
                          textShadow: '0 0 10px #00ffff',
                        }
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{
                      mt: 2,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #00ffff 0%, #0099ff 100%)',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #00cccc 0%, #0088cc 100%)',
                        boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    Sign In
                  </Button>

                  <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', px: 2 }}>
                      or
                    </Typography>
                  </Divider>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔵 Google button clicked!');
                        console.log('🔵 REACT_APP_GOOGLE_CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
                        console.log('🔵 handleGoogleLogin:', typeof handleGoogleLogin);
                        console.log('🔵 handleGoogleLogin function:', handleGoogleLogin);
                        
                        if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
                          console.error('❌ REACT_APP_GOOGLE_CLIENT_ID is missing');
                          setError('Google Sign-In is not configured. Please add REACT_APP_GOOGLE_CLIENT_ID to .env file.');
                          toast.error('Google Sign-In is not configured');
                          return;
                        }
                        
                        if (typeof handleGoogleLogin !== 'function') {
                          console.error('❌ handleGoogleLogin is not a function:', handleGoogleLogin);
                          setError('Google login handler is not available');
                          toast.error('Google login handler is not available');
                          return;
                        }
                        
                        console.log('✅ Calling handleGoogleLogin...');
                        try {
                          handleGoogleLogin();
                        } catch (error) {
                          console.error('❌ Error calling handleGoogleLogin:', error);
                          setError('Failed to initiate Google login');
                          toast.error('Failed to initiate Google login');
                        }
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
              </Box>
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;


