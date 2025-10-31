import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Section2257: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold', mb: 4 }}>
        18 U.S.C. § 2257 Record-Keeping Requirements
      </Typography>

      <Box sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.8 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Compliance Statement
        </Typography>
        <Typography variant="body1" paragraph>
          PORNRAS.com is committed to full compliance with 18 U.S.C. § 2257, 28 C.F.R. 75, and all applicable laws regarding 
          record-keeping requirements for sexually explicit material. All performers depicted in any visual content appearing 
          on this website were eighteen (18) years of age or older at the time the content was created.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Record Keeping
        </Typography>
        <Typography variant="body1" paragraph>
          In compliance with federal law, we maintain records required by 18 U.S.C. § 2257 for all content containing depictions 
          of sexually explicit conduct. These records are maintained at our offices and are available for inspection by authorized 
          government officials during normal business hours.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Custodian of Records
        </Typography>
        <Typography variant="body1" paragraph>
          The custodian of records for content appearing on this website is:
        </Typography>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body1">
            <strong>Custodian of Records</strong><br />
            PORNRAS.com<br />
            Email: records@pornras.com
          </Typography>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Age Verification
        </Typography>
        <Typography variant="body1" paragraph>
          All performers appearing in any visual depiction of sexually explicit conduct on this website were required to provide 
          government-issued identification confirming that they were at least eighteen (18) years of age at the time the content 
          was created.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Third-Party Content
        </Typography>
        <Typography variant="body1" paragraph>
          Some content on this website may be user-generated or sourced from third parties. We require all uploaders to certify 
          that they have verified the age of all performers in their content and maintain appropriate records as required by law.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Inspection of Records
        </Typography>
        <Typography variant="body1" paragraph>
          Records required to be kept by 18 U.S.C. § 2257 are available for inspection during normal business hours at our 
          designated office. To schedule an inspection, please contact the custodian of records at the address listed above.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ color: '#ff6b6b', mt: 4, mb: 2 }}>
          Contact Information
        </Typography>
        <Typography variant="body1" paragraph>
          For questions regarding our record-keeping practices or to request information about specific content, please contact 
          our custodian of records at the email address provided above.
        </Typography>

        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 4 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </Container>
  );
};

export default Section2257;

