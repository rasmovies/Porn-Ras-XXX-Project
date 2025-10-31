import React, { useState } from 'react';
import { Box, Container, Typography, Link, IconButton, Dialog, DialogContent, Button } from '@mui/material';
import { 
  Article as XIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Bluesky icon component
const BlueskyIcon = () => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    sx={{
      width: 18,
      height: 18,
      fill: 'currentColor',
    }}
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10C22 6.477 17.523 2 12 2zm-2 16l-5-5 1.414-1.414L10 15.172l7.586-7.586L19 9l-9 9z" />
  </Box>
);

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [noticeOpen, setNoticeOpen] = useState(false);

  return (
    <Box
      sx={{
        bgcolor: '#1a1a1a',
        color: 'rgba(255,255,255,0.7)',
        mt: 'auto',
        width: '100%',
      }}
    >
      {/* Main Footer Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 4,
            mb: 4,
          }}
        >
          {/* Information Column */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                mb: 2,
              }}
            >
              Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'Sitemap', path: '#' },
                { label: 'Terms & Conditions', path: '/terms' },
                { label: 'Privacy Notice', path: '/privacy' },
                { label: 'DMCA', path: '/dmca' },
                { label: '2257', path: '/2257' },
                { label: 'EU DSA', path: '#' },
                { label: 'Recommender System Guidelines', path: '#' },
                { label: 'Cookie Notice', path: '#' },
                { label: 'Accessibility', path: '#' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.path}
                  onClick={(e) => {
                    if (item.path.startsWith('/')) {
                      e.preventDefault();
                      navigate(item.path);
                    }
                  }}
                  sx={{
                    color: '#ff6b6b',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </Box>
          </Box>

          {/* Support and Help Column */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
                mb: 2,
              }}
            >
              Support and Help
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                'Content Removal',
                'Contact Support',
                'FAQ',
                'Trust and Safety',
                'Parental Controls',
                'Manage Cookies',
              ].map((item) => (
                <Link
                  key={item}
                  href="#"
                  sx={{
                    color: '#ff6b6b',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {item}
                </Link>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Bottom Footer */}
      <Box
        sx={{
          bgcolor: '#000',
          py: 2,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {/* Social Media Icons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                sx={{
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,107,107,0.2)',
                    borderColor: '#ff6b6b',
                  },
                }}
                component="a"
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <XIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,107,107,0.2)',
                    borderColor: '#ff6b6b',
                  },
                }}
                component="a"
                href="https://bsky.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BlueskyIcon />
              </IconButton>
            </Box>

            {/* Copyright */}
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              © PORNRAS.com, 2025
            </Typography>

            {/* Notice to Users Button */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                onClick={() => setNoticeOpen(true)}
                sx={{
                  bgcolor: '#ff6b6b',
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: '#ff5252',
                  },
                }}
              >
                Notice to Users
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

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
    </Box>
  );
};

export default Footer;


