import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Link,
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';

interface AgeVerificationModalProps {
  open: boolean;
  onConfirm: () => void;
  onDeny: () => void;
}

const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ open, onConfirm, onDeny }) => {
  const [noticeOpen, setNoticeOpen] = useState(false);

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
                {/* Logo */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                  <Box
                    component="img"
                    src="/PORNRAS.png"
                    alt="PORNRAS Logo"
                    sx={{
                      height: { xs: '50px', sm: '60px' },
                      width: 'auto',
                      maxWidth: '200px',
                    }}
                  />
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
                  onClick={() => setNoticeOpen(true)}
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
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.8rem'
                    }}
                  >
                    © PORNRAS.com, 2025
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
          </motion.div>
        </Dialog>
      )}

      {/* Notice to Users Dialog */}
      <Dialog
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white',
            borderRadius: '12px',
          }
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#ff6b6b', mb: 3, fontWeight: 'bold' }}>
            Notice to Users
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, lineHeight: 1.8 }}>
            <strong>CONTENT WARNING:</strong> This message contains references to sensitive content, including sexually explicit content involving minors and non-consensual acts.
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, lineHeight: 1.8 }}>
            Aylo owns and operates several free, ad-based websites, including Pornhub.com, Youporn.com, Redtube.com, Tube8.com, and Thumbzilla.com, as well as subscription-based websites associated with its free sites, including Pornhubpremium.com ("Websites").
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, lineHeight: 1.8 }}>
            The Federal Trade Commission ("FTC") and the Utah Division of Consumer Protection ("Utah") allege that some of our Websites made available videos and photos containing child sexual abuse material ("CSAM") as well as non-consensual material ("NCM"), such as revenge porn and spy camera videos.
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, lineHeight: 1.8 }}>
            We've entered into an agreement with the FTC and Utah that requires us to take steps to keep CSAM and NCM off of our Websites. To resolve the case, we must have a comprehensive program with robust safeguards to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2, color: 'rgba(255,255,255,0.9)' }}>
            <Typography component="li" sx={{ mb: 1, lineHeight: 1.8 }}>
              Verify that uploaders of pornographic content to our Websites are at least 18 years old;
            </Typography>
            <Typography component="li" sx={{ mb: 1, lineHeight: 1.8 }}>
              Verify that performers in pornographic content on our Websites are at least 18 years old;
            </Typography>
            <Typography component="li" sx={{ mb: 1, lineHeight: 1.8 }}>
              Verify that performers in pornographic content on our Websites have given written consent to the production and publication of the pornographic content;
            </Typography>
            <Typography component="li" sx={{ mb: 1, lineHeight: 1.8 }}>
              Allow performers to request to have content they appear in removed from our Websites{' '}
              <Link href="https://www.pornras.com/content-removal" target="_blank" rel="noopener" sx={{ color: '#ff6b6b' }}>
                [https://www.pornras.com/content-removal]
              </Link>
            </Typography>
            <Typography component="li" sx={{ mb: 1, lineHeight: 1.8 }}>
              Allow registered users to report CSAM and/or NCM on our Websites by flagging content, comments, and direct messages;
            </Typography>
            <Typography component="li" sx={{ mb: 1, lineHeight: 1.8 }}>
              Allow users to request removal of CSAM and/or NCM from our Websites{' '}
              <Link href="https://www.pornras.com/content-removal" target="_blank" rel="noopener" sx={{ color: '#ff6b6b' }}>
                [https://www.pornras.com/content-removal]
              </Link>
            </Typography>
            <Typography component="li" sx={{ mb: 1, lineHeight: 1.8 }}>
              Remove actual or suspected CSAM and/or NCM Aylo becomes aware of from all of our Websites; and
            </Typography>
            <Typography component="li" sx={{ mb: 1, lineHeight: 1.8 }}>
              Publish a report twice a year describing how we are taking steps to prevent CSAM and/or NCM from appearing on our platforms.
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.8 }}>
            An independent third party will audit our practices to make sure we are taking steps to prevent CSAM and NCM from appearing on our Websites. These audits will happen every two years for the next 10 years.
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setNoticeOpen(false)}
              variant="contained"
              sx={{
                bgcolor: '#ff6b6b',
                '&:hover': { bgcolor: '#ff5555' }
              }}
            >
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
};

export default AgeVerificationModal;
