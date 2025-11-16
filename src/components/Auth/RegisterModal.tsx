import React, { useState } from 'react';
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
import { emailApi } from '../../services/emailApi';

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ open, onClose, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Register form submit başladı');
    
    if (isSubmitting) {
      console.log('⚠️ Zaten submit ediliyor, işlem iptal edildi');
      return;
    }

    if (!username || !email || !password || !confirmPassword) {
      console.log('❌ Form validation hatası: Tüm alanlar doldurulmalı');
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      console.log('❌ Form validation hatası: Şifreler eşleşmiyor');
      setError('Passwords do not match');
      return;
    }
    if (!agreeToTerms) {
      console.log('❌ Form validation hatası: Şartlar kabul edilmeli');
      setError('Please agree to the terms and conditions');
      return;
    }
    
    console.log('✅ Form validation başarılı');
    setError('');
    setSuccessMessage('');

    const token =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const verifyUrl = `https://www.pornras.com/verify?token=${token}&email=${encodeURIComponent(email)}`;

    console.log('📧 Email gönderimi başlatılıyor...', { email, username, verifyUrl });
    setIsSubmitting(true);
    
    emailApi
      .sendVerificationEmail({
      email: email,           // "newuser@example.com"
      username: username,     // "newuser"
      verifyUrl: verifyUrl,   // "https://www.pornras.com/verify?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890&email=newuser%40example.com"
      })
      .then((result) => {
        console.log('✅ Email gönderimi başarılı:', result);
        setSuccessMessage('Registration received! Please check your inbox to confirm your email.');
        setTimeout(() => {
          onClose();
        }, 2500);
      })
      .catch((apiError: Error) => {
        console.error('❌ Email gönderimi hatası:', apiError);
        console.error('Error details:', {
          message: apiError?.message,
          stack: apiError?.stack,
          name: apiError?.name,
        });
        setError(apiError.message || 'Unable to send confirmation email. Please try again.');
      })
      .finally(() => {
        console.log('🏁 Email gönderimi işlemi tamamlandı');
        setIsSubmitting(false);
      });
  };

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

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
                          border: '1px solid rgba(255, 107, 107, 0.5)',
                          boxShadow: '0 0 10px rgba(255, 107, 107, 0.2)',
                        },
                        '&.Mui-focused': {
                          border: '1px solid #ff6b6b',
                          boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#ff6b6b',
                        }
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '&:hover': {
                          border: '1px solid rgba(255, 107, 107, 0.5)',
                          boxShadow: '0 0 10px rgba(255, 107, 107, 0.2)',
                        },
                        '&.Mui-focused': {
                          border: '1px solid #ff6b6b',
                          boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#ff6b6b',
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
                          border: '1px solid rgba(255, 107, 107, 0.5)',
                          boxShadow: '0 0 10px rgba(255, 107, 107, 0.2)',
                        },
                        '&.Mui-focused': {
                          border: '1px solid #ff6b6b',
                          boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#ff6b6b',
                        }
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '&:hover': {
                          border: '1px solid rgba(255, 107, 107, 0.5)',
                          boxShadow: '0 0 10px rgba(255, 107, 107, 0.2)',
                        },
                        '&.Mui-focused': {
                          border: '1px solid #ff6b6b',
                          boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#ff6b6b',
                        }
                      }
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-checked': {
                            color: '#ff6b6b',
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        I agree to the{' '}
                        <Link href="#" sx={{ color: '#ff6b6b', textDecoration: 'none' }}>
                          Terms and Conditions
                        </Link>
                      </Typography>
                    }
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    sx={{
                      mt: 2,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #ff5555 0%, #ff7777 100%)',
                        boxShadow: '0 0 30px rgba(255, 107, 107, 0.5)',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  disabled={isSubmitting}
                  >
                    Create Account
                  </Button>

                  <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', px: 2 }}>
                      or
                    </Typography>
                  </Divider>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                  </Box>

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
              </Box>
            </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default RegisterModal;
