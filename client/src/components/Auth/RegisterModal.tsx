import React, { useState, useRef, useEffect } from 'react';
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
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredUsername, setRegisteredUsername] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input when verification modal opens
    if (showVerificationModal) {
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [showVerificationModal]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    
    if (code.length !== 6) {
      setError('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }
    
    if (!registeredEmail) {
      setError('Email bulunamadı. Lütfen tekrar kayıt olun.');
      return;
    }
    
    try {
      setIsVerifying(true);
      setError('');
      
      const response = await emailApi.verifyCode({
        email: registeredEmail,
        code: code,
      });
      
      if (response.success) {
        toast.success('Email verified successfully!');
        
        // Login user
        const userData = {
          username: registeredUsername,
          email: registeredEmail,
          name: registeredUsername,
        };
        
        login(userData);
        setShowVerificationModal(false);
        onClose();
        toast.success(`Welcome, ${registeredUsername}!`);
      }
    } catch (error: any) {
      console.error('Code verification error:', error);
      setError(error.message || 'Invalid verification code. Please try again.');
      // Clear code on error
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!registeredEmail || !registeredUsername) {
      setError('Email veya kullanıcı adı bulunamadı. Lütfen tekrar kayıt olun.');
      return;
    }
    
    try {
      setIsVerifying(true);
      setError('');
      
      await emailApi.generateVerificationCode({
        email: registeredEmail,
        username: registeredUsername,
      });
      
      toast.success('New verification code sent! Please check your email.');
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('Resend code error:', error);
      setError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

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
      setError('Şifreler eşleşmiyor');
      return;
    }
    
    if (!formData.username || !formData.email || !formData.password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Step 1: Register user via backend API
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const registerData = await registerResponse.json();
      
      if (!registerResponse.ok || !registerData.success) {
        // Show detailed error in development mode
        let errorMessage = registerData.message || 'Kayıt başarısız. Lütfen tekrar deneyin.';
        if (process.env.NODE_ENV === 'development' && registerData.error) {
          console.error('Registration error details:', registerData.error);
          // Append error details in development
          if (registerData.error.message) {
            errorMessage += ` (${registerData.error.message})`;
          }
        }
        throw new Error(errorMessage);
      }
      
      console.log('✅ User registered:', registerData);
      
      // Step 2: Generate and send 6-digit verification code
      try {
        await emailApi.generateVerificationCode({
          email: formData.email,
          username: formData.username,
        });
        console.log('✅ Verification code sent');
        toast.success('Kayıt başarılı! Doğrulama kodu email adresinize gönderildi.');
        
        // Store email and username for verification
        setRegisteredEmail(formData.email);
        setRegisteredUsername(formData.username);
        
        // Show verification code modal
        setSuccessMessage('');
        setError('');
        setShowVerificationModal(true);
      } catch (emailError: any) {
        console.error('⚠️ Verification code gönderilemedi:', emailError);
        // User is registered but email verification failed
        toast('Kayıt başarılı ancak doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.', {
          icon: '⚠️',
          duration: 5000
        });
        setError('Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Kayıt başarısız. Lütfen tekrar deneyin.';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Log full error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error object:', error);
      }
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
      
      {/* Verification Code Modal */}
      <Dialog
        open={showVerificationModal}
        onClose={() => {}}
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
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <IconButton
                onClick={() => {
                  setShowVerificationModal(false);
                  setVerificationCode(['', '', '', '', '', '']);
                  setError('');
                }}
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
                  ✉️
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
                Verify Your Email
              </Typography>
              
              <Typography
                variant="body1"
                align="center"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 3,
                  fontSize: '1rem'
                }}
              >
                We've sent a 6-digit verification code to<br />
                <strong style={{ color: '#ff6b6b' }}>{registeredEmail}</strong>
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 3 }}>
                {verificationCode.map((digit, index) => (
                  <TextField
                    key={index}
                    inputRef={(el) => (codeInputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'white',
                        padding: '12px',
                      }
                    }}
                    sx={{
                      width: '60px',
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 107, 107, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#ff6b6b',
                          borderWidth: '2px',
                        },
                      },
                    }}
                  />
                ))}
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleVerifyCode}
                disabled={isVerifying || verificationCode.join('').length !== 6}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  bgcolor: '#ff6b6b',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  mb: 2,
                  '&:hover': {
                    bgcolor: '#ff5252',
                  },
                  '&:disabled': {
                    bgcolor: 'rgba(255, 107, 107, 0.5)',
                  }
                }}
              >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="text"
                  onClick={handleResendCode}
                  disabled={isVerifying}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: '#ff6b6b',
                      background: 'rgba(255, 107, 107, 0.1)',
                    }
                  }}
                >
                  Didn't receive code? Resend
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </motion.div>
      </Dialog>
    </AnimatePresence>
  );
};

export default RegisterModal;
