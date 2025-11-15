import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ContentRemoval: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    confirmEmail: '',
    legalName: '',
    reportingType: 'abusive',
    urls: '',
    appearInContent: '',
    additionalInfo: '',
    signature: '',
  });
  const [charCount, setCharCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form Data:', formData);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setFormData({
        email: '',
        confirmEmail: '',
        legalName: '',
        reportingType: 'abusive',
        urls: '',
        appearInContent: '',
        additionalInfo: '',
        signature: '',
      });
      setCharCount(0);
    }, 5000);
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'additionalInfo') {
      setCharCount(value.length);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      <Container 
        maxWidth="md" 
        sx={{ 
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Header */}
        <Typography
          variant="h4"
          sx={{
            color: '#ffffff',
            fontWeight: 'bold',
            mb: 2,
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
          }}
        >
          Content Removal Request
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h6"
          sx={{
            color: '#ffffff',
            fontWeight: 'bold',
            mb: 2,
            fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
          }}
        >
          Report Abusive or Illegal Content
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#ffffff',
            mb: 4,
            lineHeight: 1.8,
          }}
        >
          PORNRAS takes all content removal requests seriously and our dedicated support team works around the clock to quickly process and remove content that violates our terms of service.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#ffffff',
            mb: 2,
            fontWeight: 'bold',
          }}
        >
          Your report is completely confidential. When you report content, the user who posted the content will not see your name or any information about you.
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#ffffff',
            mb: 4,
          }}
        >
          Please complete the form below should you be the victim of, or come across content that you have personal knowledge of as constituting:
        </Typography>

        <Box component="ul" sx={{ color: '#ffffff', mb: 4, pl: 3 }}>
          <Typography component="li" sx={{ mb: 1 }}>
            Non-consensual production and/or distribution of your image (including but not limited to such things as: revenge porn, blackmail, exploitation);
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            Content that reveals personally identifiable information (including but not limited to such things as: name, address, phone number, IP address);
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            Content that violates our Child Sexual Abuse Material Policy "CSAM"; OR
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            Otherwise abusive and/or illegal content
          </Typography>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: '#ffffff',
            mb: 4,
          }}
        >
          You may not like everything you see on PORNRAS. For content that you think is inappropriate or think may violate our terms of service, we invite our PORNRAS community to use our Flagging feature.
        </Typography>

        {/* Success Message */}
        {showSuccess && (
          <Alert severity="success" sx={{ mb: 4 }}>
            Your content removal request has been submitted successfully. Our team will review your request promptly.
          </Alert>
        )}

        {/* Contact Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            mb: 4,
          }}
        >
          {/* Email */}
          <TextField
            fullWidth
            type="email"
            label="E-mail"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
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

          {/* Confirm Email */}
          <TextField
            fullWidth
            type="email"
            label="Confirm E-Mail"
            value={formData.confirmEmail}
            onChange={(e) => handleChange('confirmEmail', e.target.value)}
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

          {/* Legal Name */}
          <TextField
            fullWidth
            label="Legal Name"
            value={formData.legalName}
            onChange={(e) => handleChange('legalName', e.target.value)}
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

          {/* Reporting Type */}
          <FormControl
            sx={{
              mb: 3,
              '& .MuiFormLabel-root': {
                color: 'white',
              },
            }}
          >
            <FormLabel sx={{ color: 'white', mb: 1 }}>
              You are reporting:
            </FormLabel>
            <RadioGroup
              value={formData.reportingType}
              onChange={(e) => handleChange('reportingType', e.target.value)}
            >
              <FormControlLabel
                value="abusive"
                control={
                  <Radio
                    sx={{
                      color: '#ff6b6b',
                      '&.Mui-checked': {
                        color: '#ff6b6b',
                      },
                    }}
                  />
                }
                label={<Typography sx={{ color: 'white' }}>Abusive or Illegal Content</Typography>}
              />
              <FormControlLabel
                value="copyright"
                control={
                  <Radio
                    sx={{
                      color: '#ff6b6b',
                      '&.Mui-checked': {
                        color: '#ff6b6b',
                      },
                    }}
                  />
                }
                label={<Typography sx={{ color: 'white' }}>Copyright Infringement</Typography>}
              />
            </RadioGroup>
          </FormControl>

          {/* URLs */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="URLs of the content you are reporting:"
            value={formData.urls}
            onChange={(e) => handleChange('urls', e.target.value)}
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

          {/* Appear in Content */}
          <FormControl
            sx={{
              mb: 3,
              '& .MuiFormLabel-root': {
                color: 'white',
              },
            }}
          >
            <FormLabel sx={{ color: 'white', mb: 1 }}>
              Do you appear in this content or have first-hand knowledge that the content violates our{' '}
              <MuiLink href="#" sx={{ color: '#ff6b6b', textDecoration: 'none' }}>Non-consensual Content Policy</MuiLink> or{' '}
              <MuiLink href="#" sx={{ color: '#ff6b6b', textDecoration: 'none' }}>CSAM Policy</MuiLink>?
            </FormLabel>
            <RadioGroup
              value={formData.appearInContent}
              onChange={(e) => handleChange('appearInContent', e.target.value)}
            >
              <FormControlLabel
                value="yes"
                control={
                  <Radio
                    sx={{
                      color: '#ff6b6b',
                      '&.Mui-checked': {
                        color: '#ff6b6b',
                      },
                    }}
                  />
                }
                label={<Typography sx={{ color: 'white' }}>Yes</Typography>}
              />
              <FormControlLabel
                value="no"
                control={
                  <Radio
                    sx={{
                      color: '#ff6b6b',
                      '&.Mui-checked': {
                        color: '#ff6b6b',
                      },
                    }}
                  />
                }
                label={<Typography sx={{ color: 'white' }}>No</Typography>}
              />
            </RadioGroup>
          </FormControl>

          {/* Additional Information */}
          <Typography
            variant="h6"
            sx={{
              color: '#ffffff',
              fontWeight: 'bold',
              mb: 2,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            }}
          >
            Additional Information
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: '#ffffff',
              mb: 2,
              fontSize: { xs: '0.875rem', sm: '0.875rem', md: '0.875rem' },
            }}
          >
            Please provide any additional information which might help us to resolve your request. If you are submitting a request on the behalf of someone else appearing in the content, please provide your association to this person.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={6}
            label="Additional Information:"
            value={formData.additionalInfo}
            onChange={(e) => handleChange('additionalInfo', e.target.value)}
            inputProps={{ maxLength: 300 }}
            helperText={`${charCount}/300`}
            sx={{
              mb: 2,
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
              '& .MuiFormHelperText-root': {
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          />

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 4,
            }}
          >
            Please be aware that abuse of this content removal request process hinders our team's ability to process valid and actionable removal requests.
          </Typography>

          {/* Digital Signature */}
          <Typography
            variant="h6"
            sx={{
              color: '#ffffff',
              fontWeight: 'bold',
              mb: 2,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            }}
          >
            Digital Signature
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: '#ffffff',
              mb: 2,
            }}
          >
            By typing your name in the field below, you guarantee that you are the person being named and represented on this form and that all provided information is accurate.
          </Typography>

          <TextField
            fullWidth
            label="Legal Name"
            value={formData.signature}
            onChange={(e) => handleChange('signature', e.target.value)}
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
            fullWidth
            sx={{
              bgcolor: '#ff6b6b',
              color: 'white',
              textTransform: 'none',
              py: 1.5,
              '&:hover': {
                bgcolor: '#ff5252',
              },
            }}
          >
            Submit
          </Button>
        </Box>

        {/* MediaWise Section */}
        <Box sx={{ mt: 6 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#ffffff',
              fontWeight: 'bold',
              mb: 2,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            }}
          >
            How To Make Sure A Video Never Gets Uploaded To PORNRAS Again:
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#ffffff',
              mb: 2,
              lineHeight: 1.8,
            }}
          >
            We use MediaWise®, a third-party automated audiovisual identification system, to assist us in identifying and blocking content from being uploaded by users. Videos uploaded to PORNRAS are compared against MediaWise®'s database of digital fingerprints. When a video is matched to a digital fingerprint, access to it is disabled. If you are interested in having your content digitally fingerprinted by the provider of the automated audiovisual identification system we use, please contact Vobile Customer Support at support@vobileinc.com or by phone 1-408-492-1100.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ContentRemoval;

