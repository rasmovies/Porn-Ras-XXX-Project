import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  Link,
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';

interface AgeVerificationModalProps {
  open: boolean;
  onConfirm: () => void;
  onDeny: () => void;
}

const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ open, onConfirm, onDeny }) => {
  const [language, setLanguage] = useState('English');

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
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
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(10px)',
            }
          }}
          disableEscapeKeyDown
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <DialogContent sx={{ p: 0, position: 'relative' }}>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '3rem',
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'center',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    borderRadius: '20px',
                    zIndex: -1,
                  }
                }}
              >
                {/* Language Selector */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#ff6b6b',
                        },
                        '& .MuiSelect-icon': {
                          color: 'white',
                        }
                      }}
                    >
                      <MenuItem value="English">English</MenuItem>
                      <MenuItem value="Turkish">Türkçe</MenuItem>
                      <MenuItem value="Spanish">Español</MenuItem>
                      <MenuItem value="French">Français</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Logo */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: { xs: '2rem', sm: '3rem' },
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}
                  >
                    Adult
                    <Box
                      component="span"
                      sx={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: { xs: '1.5rem', sm: '2rem' },
                        fontWeight: 'bold',
                        boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)'
                      }}
                    >
                      Tube
                    </Box>
                  </Typography>
                </Box>

                {/* Main Heading */}
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 4,
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
                  }}
                >
                  This is an adult website
                </Typography>

                {/* Notice Button */}
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#ff6b6b',
                    color: '#ff6b6b',
                    mb: 4,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    fontSize: '1rem',
                    '&:hover': {
                      borderColor: '#ff5555',
                      background: 'rgba(255, 107, 107, 0.1)',
                    }
                  }}
                >
                  Notice to Users
                </Button>

                {/* Disclaimer Text */}
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 4,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    lineHeight: 1.6,
                    maxWidth: '500px',
                    mx: 'auto'
                  }}
                >
                  This website contains age-restricted materials including nudity and explicit depictions of sexual activity. 
                  By entering, you affirm that you are at least 18 years of age or the age of majority in the jurisdiction 
                  you are accessing the website from and you consent to viewing sexually explicit content.
                </Typography>

                {/* Terms Notice */}
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 4,
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    lineHeight: 1.5
                  }}
                >
                  Our Terms are changing. These changes will or have come into effect on{' '}
                  <Box component="span" sx={{ fontWeight: 'bold' }}>30 June 2025</Box>. 
                  To see the updated changes, please see our{' '}
                  <Link
                    href="#"
                    sx={{
                      color: '#ff6b6b',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      '&:hover': {
                        textShadow: '0 0 10px #ff6b6b',
                      }
                    }}
                  >
                    New Terms of Service
                  </Link>.
                </Typography>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button
                    onClick={onConfirm}
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #ff5555 0%, #ff7777 100%)',
                        boxShadow: '0 0 30px rgba(255, 107, 107, 0.5)',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    I am 18 or older - Enter
                  </Button>
                  <Button
                    onClick={onDeny}
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  >
                    I am under 18 - Exit
                  </Button>
                </Box>

                {/* Parental Controls */}
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    mb: 2
                  }}
                >
                  Our{' '}
                  <Link
                    href="#"
                    sx={{
                      color: '#ff6b6b',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      '&:hover': {
                        textShadow: '0 0 10px #ff6b6b',
                      }
                    }}
                  >
                    parental controls page
                  </Link>{' '}
                  explains how you can easily block access to this site.
                </Typography>

                {/* Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.8rem'
                    }}
                  >
                    © AdultTube.com, 2025
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    RTA®
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

export default AgeVerificationModal;
