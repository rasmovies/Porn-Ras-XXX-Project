import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Privacy: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 4 }}>
        Privacy Notice
      </Typography>

      <Box sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.8 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          1. Information We Collect
        </Typography>
        <Typography variant="body1" paragraph>
          We collect information that you provide directly to us, such as when you create an account, make a purchase, 
          subscribe to our newsletter, or contact us for support. This may include your name, email address, payment 
          information, and any other information you choose to provide.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          2. How We Use Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          We use the information we collect to provide, maintain, and improve our services, process transactions, 
          send you technical notices and support messages, communicate with you about products and services, and monitor 
          and analyze trends and usage.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          3. Information Sharing
        </Typography>
        <Typography variant="body1" paragraph>
          We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
          except as described in this policy. We may share information with service providers who assist us in operating 
          our website and conducting our business, so long as those parties agree to keep this information confidential.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          4. Cookies and Tracking Technologies
        </Typography>
        <Typography variant="body1" paragraph>
          We use cookies and similar tracking technologies to track activity on our website and hold certain information. 
          Cookies are files with a small amount of data which may include an anonymous unique identifier.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          5. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We implement appropriate technical and organizational security measures to protect your personal information. 
          However, no method of transmission over the Internet or electronic storage is 100% secure.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          6. Your Rights
        </Typography>
        <Typography variant="body1" paragraph>
          You have the right to access, update, or delete your personal information at any time. You may also opt out of 
          certain communications from us. Please contact us if you wish to exercise these rights.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          7. Third-Party Links
        </Typography>
        <Typography variant="body1" paragraph>
          Our website may contain links to third-party websites. We are not responsible for the privacy practices of 
          these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          8. Children's Privacy
        </Typography>
        <Typography variant="body1" paragraph>
          Our website is not intended for individuals under the age of 18. We do not knowingly collect personal information 
          from children under 18. If you believe we have collected information from a child under 18, please contact us immediately.
        </Typography>

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 4 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </Container>
  );
};

export default Privacy;



