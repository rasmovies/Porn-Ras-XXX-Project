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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [showNormalForm, setShowNormalForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Register form submit başladı');
    
    // Browser automation için: Her zaman DOM'dan input değerlerini oku (state'ler güncellenmemiş olabilir)
    let finalUsername = username;
    let finalEmail = email;
    let finalPassword = password;
    let finalConfirmPassword = confirmPassword;
    let finalAgreeToTerms = agreeToTerms;
    
    if (typeof document !== 'undefined') {
      const form = e.currentTarget.closest('form') || e.currentTarget;
      const usernameInput = form.querySelector('input[type="text"]') as HTMLInputElement;
      const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInputs = form.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;
      const checkbox = form.querySelector('input[type="checkbox"]') as HTMLInputElement;
      
      // Her zaman DOM'dan oku (browser automation için)
      if (usernameInput) {
        finalUsername = usernameInput.value || finalUsername;
        if (usernameInput.value) {
          setUsername(finalUsername);
          console.log('📝 Username DOM\'dan okundu:', finalUsername);
        }
      }
      if (emailInput) {
        finalEmail = emailInput.value || finalEmail;
        if (emailInput.value) {
          setEmail(finalEmail);
          console.log('📝 Email DOM\'dan okundu:', finalEmail);
        }
      }
      if (passwordInputs.length >= 1) {
        finalPassword = passwordInputs[0].value || finalPassword;
        if (passwordInputs[0].value) {
          setPassword(finalPassword);
          console.log('📝 Password DOM\'dan okundu');
        }
      }
      if (passwordInputs.length >= 2) {
        finalConfirmPassword = passwordInputs[1].value || finalConfirmPassword;
        if (passwordInputs[1].value) {
          setConfirmPassword(finalConfirmPassword);
          console.log('📝 Confirm Password DOM\'dan okundu');
        }
      }
      if (checkbox) {
        finalAgreeToTerms = checkbox.checked || finalAgreeToTerms;
        setAgreeToTerms(finalAgreeToTerms);
        console.log('📝 Checkbox DOM\'dan okundu:', finalAgreeToTerms);
      }
    }
    
    console.log('📝 Form values:', { 
      username: finalUsername, 
      email: finalEmail, 
      password: finalPassword ? '***' : 'EMPTY', 
      confirmPassword: finalConfirmPassword ? '***' : 'EMPTY', 
      agreeToTerms: finalAgreeToTerms 
    });
    
    if (isSubmitting) {
      console.log('⚠️ Zaten submit ediliyor, işlem iptal edildi');
      return;
    }

    if (!finalUsername || !finalEmail || !finalPassword || !finalConfirmPassword) {
      console.log('❌ Form validation hatası: Tüm alanlar doldurulmalı', { 
        username: !!finalUsername, 
        email: !!finalEmail, 
        password: !!finalPassword, 
        confirmPassword: !!finalConfirmPassword 
      });
      setError('Please fill in all fields');
      return;
    }
    if (finalPassword !== finalConfirmPassword) {
      console.log('❌ Form validation hatası: Şifreler eşleşmiyor');
      setError('Passwords do not match');
      return;
    }
    if (!finalAgreeToTerms) {
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
    const verifyUrl = `${window.location.origin}/verify?token=${token}&email=${encodeURIComponent(finalEmail)}`;

    console.log('📧 Email gönderimi başlatılıyor...', { email: finalEmail, username: finalUsername, verifyUrl });
    setIsSubmitting(true);
    
    emailApi
      .sendVerificationEmail({
        email: finalEmail,
        username: finalUsername,
        verifyUrl,
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

  const handleMagicLink = async () => {
    if (!magicLinkEmail || !magicLinkEmail.includes('@')) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsSendingMagicLink(true);
      setError('');

      // Generate magic link token
      const token =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      
      const magicLink = `${window.location.origin}/verify?token=${token}&email=${encodeURIComponent(magicLinkEmail)}`;

      console.log('📧 Magic link gönderimi başlatılıyor...', { email: magicLinkEmail, magicLink });

      await emailApi.sendMagicLink({
        email: magicLinkEmail,
        magicLink,
      });

      console.log('✅ Magic link gönderimi başarılı');
      setSuccessMessage('Magic link sent! Please check your inbox.');
      toast.success('Magic link sent! Please check your inbox.');
      
      // Reset form after a delay
      setTimeout(() => {
        setShowMagicLink(false);
        setMagicLinkEmail('');
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('❌ Magic link gönderimi hatası:', error);
      setError(error.message || 'Unable to send magic link. Please try again.');
      toast.error('Failed to send magic link');
    } finally {
      setIsSendingMagicLink(false);
    }
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

                {showNormalForm ? (
                  <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
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
                    name="email"
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
                    name="password"
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
                    name="confirmPassword"
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

                  <Button
                    variant="text"
                    fullWidth
                    type="button"
                    onClick={() => {
                      setShowNormalForm(false);
                      setError('');
                    }}
                    sx={{
                      mt: 1,
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.9rem',
                      '&:hover': {
                        color: '#ff6b6b',
                        background: 'rgba(255, 107, 107, 0.1)',
                      }
                    }}
                  >
                    Or use social login
                  </Button>
                  </Box>
                ) : showMagicLink ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        placeholder="Enter your email address"
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
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleMagicLink}
                          disabled={isSendingMagicLink}
                          sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #ff5252 0%, #ff3d3d 100%)',
                            },
                            '&:disabled': {
                              opacity: 0.6,
                            }
                          }}
                        >
                          {isSendingMagicLink ? 'Sending...' : 'Send Magic Link'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setShowMagicLink(false);
                            setMagicLinkEmail('');
                            setError('');
                          }}
                          sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            '&:hover': {
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : !showNormalForm ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowMagicLink(true);
                          setError('');
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
                        Continue with Email
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
                      <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', px: 2 }}>
                          or
                        </Typography>
                      </Divider>
                      <Button
                        variant="outlined"
                        fullWidth
                        type="button"
                        onClick={() => {
                          setShowNormalForm(true);
                          setError('');
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
                        Sign up with Email and Password
                      </Button>
                    </Box>
                  ) : null}

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
