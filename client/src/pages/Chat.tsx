import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import { useAuth } from '../components/Auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

const Chat: React.FC = () => {
  const { openLoginModal } = useAuth();
  const navigate = useNavigate();
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [ageVerified, setAgeVerified] = useState(() => {
    return localStorage.getItem('chat_age_verified') === 'true';
  });
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Generate years from 1950 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const verifyAge = () => {
    if (!birthYear || !birthMonth || !birthDay) {
      return;
    }

    const monthIndex = months.indexOf(birthMonth);
    const birthDate = new Date(parseInt(birthYear), monthIndex, parseInt(birthDay));
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age >= 18) {
      setAgeVerified(true);
      localStorage.setItem('chat_age_verified', 'true');
      // Show chat interface after verification
    } else {
      alert('You must be at least 18 years old to access this content.');
    }
  };

  // Age verification flow
  if (!ageVerified && !showAgeVerification) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)',
          pt: 12,
          pb: 8,
        }}
      >
        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                mb: 2,
              }}
            >
              Notice to Users
            </Typography>
          </Box>

          {/* Age Verification Prompt with Notice Text */}
          <Paper
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              p: 4,
              mb: 3,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.8,
                mb: 3,
              }}
            >
              Dear user,
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.8,
                mb: 3,
              }}
            >
              As you may know, your elected officials are requiring us to verify your age before allowing you access to our website. 
              While safety and compliance are at the forefront of our mission, giving your ID card every time you want to visit 
              an adult platform is not the most effective solution for protecting our users, and in fact, will put children and 
              your privacy at risk.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.8,
                mb: 3,
              }}
            >
              In addition, mandating age verification without proper enforcement gives platforms the opportunity to choose whether 
              or not to comply. As we've seen in other states, this just drives traffic to sites with far fewer safety measures 
              in place. Very few sites are able to compare to the robust Trust and Safety measures we currently have in place. 
              To protect children and user privacy, any legislation must be enforced against all platforms offering adult content.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.8,
                mb: 3,
              }}
            >
              The safety of our users is one of our biggest concerns. We believe that the best and most effective solution for 
              protecting children and adults alike is to identify users by their device and allow access to age-restricted materials 
              and websites based on that identification. Until a real solution is offered, we are continuously working to improve 
              our safety measures and age verification systems.
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.8,
                mb: 3,
              }}
            >
              Please contact your representatives before it is too late and demand device-based verification solutions that make 
              the internet safer while also respecting your privacy.
            </Typography>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowAgeVerification(true)}
                sx={{
                  bgcolor: '#ff6b6b',
                  color: 'white',
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: '#ff5252',
                  }
                }}
              >
                Continue to Age Verification
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Age verification form
  if (showAgeVerification && !ageVerified) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)',
          pt: 12,
          pb: 8,
        }}
      >
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              p: 4,
              mb: 3,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                mb: 3,
                textAlign: 'center',
              }}
            >
              Verify Your Age
            </Typography>
            
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                mb: 3,
                textAlign: 'center',
              }}
            >
              Please select your date of birth to verify you are 18 years or older
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Month</InputLabel>
                <Select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  label="Month"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'white',
                    },
                  }}
                >
                  {months.map((month) => (
                    <MenuItem key={month} value={month} sx={{ color: 'black' }}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Day</InputLabel>
                <Select
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  label="Day"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'white',
                    },
                  }}
                >
                  {days.map((day) => (
                    <MenuItem key={day} value={day} sx={{ color: 'black' }}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Year</InputLabel>
                <Select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  label="Year"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'white',
                    },
                  }}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year} sx={{ color: 'black' }}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowAgeVerification(false)}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  }
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={verifyAge}
                disabled={!birthYear || !birthMonth || !birthDay}
                sx={{
                  bgcolor: '#ff6b6b',
                  color: 'white',
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: '#ff5252',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                Verify Age
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Chat interface (after age verification)
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)',
        pt: 12,
        pb: 8,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back to Profile */}
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/profile')}
            sx={{
              color: '#ff6b6b',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(255,107,107,0.1)',
              }
            }}
          >
            Back to profile
          </Button>
        </Box>

        {/* Chat Interface */}
        <Box sx={{ display: 'flex', gap: 2, height: '70vh' }}>
          {/* Left Sidebar - Tabs */}
          <Box
            sx={{
              width: '250px',
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.1)',
              p: 2,
            }}
          >
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTabs-indicator': {
                  left: 0,
                  width: '3px',
                },
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: activeTab === 0 ? 'bold' : 'normal',
                  color: activeTab === 0 ? '#ff6b6b' : 'rgba(255,255,255,0.7)',
                  borderLeft: activeTab === 0 ? '2px solid #ff6b6b' : '2px solid transparent',
                  mb: 1,
                  '&.Mui-selected': {
                    color: '#ff6b6b',
                  },
                },
              }}
            >
              <Tab label="Inbox" />
              <Tab label="Requests" />
            </Tabs>
          </Box>

          {/* Right Content Area */}
          <Box
            sx={{
              flex: 1,
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                gap: 3,
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                You have no messages.
              </Typography>
              
              {/* Logos */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  alignItems: 'center',
                }}
              >
                {/* Porn Ras Logo */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    bgcolor: 'rgba(30, 40, 50, 0.8)',
                    borderRadius: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 4,
                        bgcolor: '#8B0000',
                        borderRadius: '2px',
                      }}
                    />
                    <Box
                      sx={{
                        width: 8,
                        height: 4,
                        bgcolor: 'rgba(200,200,200,0.8)',
                        borderRadius: '2px',
                      }}
                    />
                    <Box
                      sx={{
                        width: 8,
                        height: 4,
                        bgcolor: '#8B0000',
                        borderRadius: '2px',
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    Porn Ras
                  </Typography>
                </Box>

                {/* PR Logo */}
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(20, 20, 25, 0.9)',
                    borderRadius: 1,
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: '80%',
                        height: '1px',
                        bgcolor: 'white',
                      }}
                    />
                    <Typography
                      sx={{
                        color: 'white',
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        position: 'relative',
                        fontFamily: 'Arial, sans-serif',
                      }}
                    >
                      P
                      <Box
                        component="span"
                        sx={{
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: '-8px',
                            width: '12px',
                            height: '1px',
                            bgcolor: '#ff0000',
                            transform: 'rotate(-25deg)',
                          }
                        }}
                      >
                        R
                      </Box>
                    </Typography>
                    <Box
                      sx={{
                        width: '80%',
                        height: '1px',
                        bgcolor: 'white',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Chat;
