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
import { emailApi } from '../../services/emailApi';
import { useAuth } from './AuthProvider';
import toast from 'react-hot-toast';

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ open, onClose, onSwitchToLogin }) => {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!formData.username || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // TODO: Backend'e kayıt isteği gönder
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      // TODO: Backend'den token alınacak, şimdilik simüle ediyoruz
      const token = `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const verifyUrl = `${window.location.origin}/verify-email?token=${token}&email=${encodeURIComponent(formData.email)}&type=verification`;
      
      // Verification email gönder
      try {
        await emailApi.sendVerificationEmail({
          email: formData.email,
          username: formData.username,
          verifyUrl: verifyUrl,
        });
        console.log('✅ Verification email sent');
        toast.success('Verification email sent! Please check your inbox.');
      } catch (emailError) {
        console.error('⚠️ Verification email gönderilemedi:', emailError);
        toast.error('Verification email could not be sent. Please try again.');
      }
      
      // Kullanıcıyı otomatik login yapma, email doğrulamasını bekle
      // login(userData);
      setSuccessMessage('Registration successful! Please check your email to verify your account.');
      toast.success('Registration successful! Please verify your email.');
      
      // 3 saniye sonra modal'ı kapat
      setTimeout(() => {
        onClose();
        // Login sayfasına yönlendir
        window.location.href = '/login';
      }, 3000);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
      toast.error('Registration failed');
    } finally {
      setIsSubmitting(false);
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
        setIsSubmitting(true);
        setError('');
        
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
        setSuccessMessage('Registration successful!');
        onClose();
      } catch (error: any) {
        console.error('Google login error:', error);
        setError('Google registration failed. Please try again.');
        toast.error('Google registration failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => {
      setError('Google registration was cancelled or failed');
      toast.error('Google registration failed');
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

              {/* Register Form */}
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
                {/* Star Icon */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography
                    variant="h3"
                    sx={{
                      color: '#ff6b6b',
                      textShadow: '0 0 20px #ff6b6b, 0 0 40px #ff6b6b',
                      fontWeight: 'bold',
                      mb: 0.5
                    }}
                  >
                    ✨
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
                    mb: 0.5,
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
                  }}
                >
                  Sign Up
                </Typography>
                
                <Typography
                  variant="body1"
                  align="center"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  Create your account
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
                    {error}
                  </Alert>
                )}
                {successMessage && (
                  <Alert severity="success" sx={{ mb: 3, background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    {successMessage}
                  </Alert>
                )}

                {!showForm ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      type="button"
                      onClick={() => {
                        if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
                          setError('Google Sign-In is not configured. Please add REACT_APP_GOOGLE_CLIENT_ID to .env file.');
                          toast.error('Google Sign-In is not configured');
                          console.error('REACT_APP_GOOGLE_CLIENT_ID is missing');
                          return;
                        }
                        handleGoogleLogin();
                      }}
                      disabled={isSubmitting}
                      sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '1rem',
                        '&:hover': {
                          border: '1px solid rgba(255, 107, 107, 0.5)',
                          background: 'rgba(255, 107, 107, 0.1)',
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
                          border: '1px solid rgba(255, 107, 107, 0.5)',
                          background: 'rgba(255, 107, 107, 0.1)',
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
                          border: '1px solid rgba(255, 107, 107, 0.5)',
                          background: 'rgba(255, 107, 107, 0.1)',
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
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleFormChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 107, 107, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#ff6b6b',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 107, 107, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#ff6b6b',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 107, 107, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#ff6b6b',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleFormChange}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 107, 107, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#ff6b6b',
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
                      disabled={isSubmitting}
                      sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        bgcolor: '#ff6b6b',
                        color: 'white',
                        fontSize: '1rem',
                        '&:hover': {
                          bgcolor: '#ff5252',
                        },
                        '&:disabled': {
                          bgcolor: 'rgba(255, 107, 107, 0.5)',
                        }
                      }}
                    >
                      {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setShowForm(false);
                        setError('');
                        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
                      }}
                      sx={{
                        py: 1.5,
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '1rem',
                        '&:hover': {
                          border: '1px solid rgba(255, 107, 107, 0.5)',
                          background: 'rgba(255, 107, 107, 0.1)',
                        }
                      }}
                    >
                      Back
                    </Button>
                  </Box>
                )}

                  <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
                      Already have an account?{' '}
                      <Link
                        component="button"
                        onClick={onSwitchToLogin}
                        sx={{
                          color: '#ff6b6b',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                          '&:hover': {
                            textShadow: '0 0 10px #ff6b6b',
                          }
                        }}
                      >
                        Sign in
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

export default RegisterModal;
