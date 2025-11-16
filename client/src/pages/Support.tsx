import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Support: React.FC = () => {
  const navigate = useNavigate();
  const [supportType, setSupportType] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Support Type:', supportType);
    console.log('Message:', message);
    alert('Your message has been sent!');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0a0a',
        pt: 12,
        pb: 8,
        color: 'white',
      }}
    >
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Typography
          variant="h4"
          sx={{
            color: '#ffffff',
            fontWeight: 'bold',
            mb: 4,
          }}
        >
          Contact Us
        </Typography>

        {/* Pornhub Support Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#ffffff',
              fontWeight: 'bold',
              mb: 1,
            }}
          >
            PORNRAS Support
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#ffffff',
              mb: 3,
            }}
          >
            Need help? Please fill out the form below. If you have a PORNRAS account, please log into your account first to help us expedite your request.
          </Typography>
        </Box>

        {/* Model Program Support Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#ffffff',
              fontWeight: 'bold',
              mb: 1,
            }}
          >
            Model Program Support
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#ffffff',
              mb: 3,
            }}
          >
            Please visit our <MuiLink href="#" sx={{ color: '#ff6b6b', textDecoration: 'none', fontWeight: 'bold' }}>FAQs</MuiLink> first to get quick answers. Still need help? Fill out the form below. If you have an account, please log in first to help us expedite your request. If you are unable to log into your account, please provide the email and username associated with your account.
          </Typography>
        </Box>

        {/* DSA Query Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#ffffff',
              fontWeight: 'bold',
              mb: 1,
            }}
          >
            DSA Query
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#ffffff',
              mb: 3,
            }}
          >
            Please complete the form below for any inquiries, requests, or complaints related to the Digital Services Act.
          </Typography>
        </Box>

        {/* Contact Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            mb: 4,
          }}
        >
          <FormControl
            fullWidth
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#1a1a1a',
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ff6b6b',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          >
            <InputLabel id="support-type-label">Type:</InputLabel>
            <Select
              labelId="support-type-label"
              value={supportType}
              label="Type:"
              onChange={(e) => setSupportType(e.target.value)}
            >
              <MenuItem value="general">General Support</MenuItem>
              <MenuItem value="model">Model Program</MenuItem>
              <MenuItem value="dsa">DSA Query</MenuItem>
              <MenuItem value="technical">Technical Issue</MenuItem>
              <MenuItem value="account">Account Help</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={8}
            label="Message:"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#1a1a1a',
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
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
            sx={{
              bgcolor: '#ff6b6b',
              color: 'white',
              textTransform: 'none',
              px: 4,
              py: 1.5,
              '&:hover': {
                bgcolor: '#ff5252',
              },
            }}
          >
            Send
          </Button>
        </Box>

        {/* Content Removal Request */}
        <Typography
          variant="body1"
          sx={{
            color: '#ffffff',
            mb: 4,
          }}
        >
          For any content removal requests please use our{' '}
          <MuiLink
            href="/content-removal"
            onClick={(e) => {
              e.preventDefault();
              navigate('/content-removal');
            }}
            sx={{ color: '#ff6b6b', textDecoration: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            content removal form
          </MuiLink>
        </Typography>

        {/* FAQ Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: '300px' }}>
            <Typography
              variant="h5"
              sx={{
                color: '#ffffff',
                fontWeight: 'bold',
                mb: 2,
              }}
            >
              Have You Checked Out Our FAQ?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#ffffff',
              }}
            >
              Before sending feedback, you might want to check out our FAQ page. This may answer questions you have about the site, without having to type us a full email. To visit the FAQ page, please{' '}
              <MuiLink href="#" sx={{ color: '#ff6b6b', textDecoration: 'none', fontWeight: 'bold' }}>
                click here
              </MuiLink>
              .
            </Typography>
          </Box>

          <Button
            variant="contained"
            sx={{
              bgcolor: '#ff6b6b',
              color: 'white',
              textTransform: 'none',
              px: 4,
              py: 1.5,
              '&:hover': {
                bgcolor: '#ff5252',
              },
            }}
          >
            Visit FAQ page
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Support;
