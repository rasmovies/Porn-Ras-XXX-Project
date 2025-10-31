import React from 'react';
import { Box, Container, Typography, Link, IconButton } from '@mui/material';
import { 
  Article as XIcon 
} from '@mui/icons-material';

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
                'Sitemap',
                'Terms & Conditions',
                'Privacy Notice',
                'DMCA',
                '2257',
                'EU DSA',
                'Recommender System Guidelines',
                'Cookie Notice',
                'Accessibility',
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

            {/* RTA Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                RTA®
              </Typography>
              <Box
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
    </Box>
  );
};

export default Footer;


