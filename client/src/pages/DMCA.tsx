import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const DMCA: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 4 }}>
        DMCA Copyright Policy
      </Typography>

      <Box sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.8 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Digital Millennium Copyright Act (DMCA) Notice
        </Typography>
        <Typography variant="body1" paragraph>
          PORNRAS.com respects the intellectual property rights of others and expects its users to do the same. In accordance 
          with the Digital Millennium Copyright Act (DMCA), we will respond promptly to notices of alleged copyright infringement 
          that are reported to our designated Copyright Agent.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Filing a DMCA Notice
        </Typography>
        <Typography variant="body1" paragraph>
          If you believe that content available through our website infringes your copyright, you may send us a notice 
          requesting that the material be removed, or access to it be blocked. Your notice must include the following information:
        </Typography>
        <Box component="ol" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" sx={{ mb: 1 }}>
            A physical or electronic signature of a person authorized to act on behalf of the owner of the copyright interest;
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            A description of the copyrighted work that you claim has been infringed;
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            A description of where the material that you claim is infringing is located on the website;
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            Your address, telephone number, and email address;
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            A statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, 
            its agent, or the law;
          </Typography>
          <Typography component="li" sx={{ mb: 1 }}>
            A statement by you, made under penalty of perjury, that the above information in your notice is accurate and that 
            you are the copyright owner or authorized to act on the copyright owner's behalf.
          </Typography>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Submitting a DMCA Notice
        </Typography>
        <Typography variant="body1" paragraph>
          Please send your DMCA notice to our designated Copyright Agent at:
        </Typography>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body1">
            <strong>Email:</strong> dmca@pornras.com<br />
            <strong>Subject:</strong> DMCA Copyright Infringement Notice
          </Typography>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Counter-Notification
        </Typography>
        <Typography variant="body1" paragraph>
          If you believe that your content was removed in error, you may send us a counter-notification. Your counter-notification 
          must include all of the information required by the DMCA.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Repeat Infringers
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right to terminate accounts of users who are repeat infringers of copyrighted material.
        </Typography>

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 4 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </Container>
  );
};

export default DMCA;



