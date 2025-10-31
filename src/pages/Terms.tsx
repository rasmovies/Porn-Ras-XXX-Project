import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Terms: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 4 }}>
        Terms & Conditions
      </Typography>

      <Box sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.8 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          1. Acceptance of Terms
        </Typography>
        <Typography variant="body1" paragraph>
          By accessing and using PORNRAS.com, you accept and agree to be bound by the terms and provision of this agreement. 
          If you do not agree to abide by the above, please do not use this service.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          2. Age Restriction
        </Typography>
        <Typography variant="body1" paragraph>
          This website contains adult content. You must be at least 18 years old (or the age of majority in your jurisdiction) 
          to access this website. By accessing this website, you represent and warrant that you are of legal age to view adult content.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          3. Content Usage
        </Typography>
        <Typography variant="body1" paragraph>
          All content on this website is for personal, non-commercial use only. You may not reproduce, distribute, modify, 
          create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the 
          material on our website without prior written consent.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          4. User Conduct
        </Typography>
        <Typography variant="body1" paragraph>
          You agree not to use the website in any way that violates any applicable laws or regulations, or to engage in 
          any conduct that restricts or inhibits anyone's use or enjoyment of the website, or which may harm the website or 
          expose us to liability.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          5. Intellectual Property
        </Typography>
        <Typography variant="body1" paragraph>
          The website and its original content, features, and functionality are owned by PORNRAS.com and are protected by 
          international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          6. Disclaimer
        </Typography>
        <Typography variant="body1" paragraph>
          The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, 
          PORNRAS.com excludes all representations, warranties, conditions, and terms relating to our website and the use 
          of this website.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          7. Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          In no event shall PORNRAS.com, its officers, directors, employees, or agents be liable for any indirect, 
          incidental, special, consequential, or punitive damages resulting from your use of or inability to use the website.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          8. Changes to Terms
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new 
          Terms and Conditions on this page. Your continued use of the website after any changes constitutes acceptance of those changes.
        </Typography>

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 4 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </Container>
  );
};

export default Terms;

