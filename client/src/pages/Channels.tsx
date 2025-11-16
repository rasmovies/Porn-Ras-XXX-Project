import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { Search, Person } from '@mui/icons-material';
import { Channel } from '../lib/supabase';
import { channelService } from '../services/database';
import SEO from '../components/SEO/SEO';

const Channels: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChannels(channels);
    } else {
      setFilteredChannels(
        channels.filter(channel =>
          channel.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, channels]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await channelService.getAll();
      setChannels(data);
      setFilteredChannels(data);
    } catch (error) {
      console.error('Error loading channels:', error);
      // Fallback to localStorage
      const savedChannels = localStorage.getItem('adminChannels');
      if (savedChannels) {
        const parsed = JSON.parse(savedChannels);
        setChannels(parsed);
        setFilteredChannels(parsed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = (channel: Channel) => {
    const channelSlug = channel.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/channels/${channelSlug}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
          Channels
        </Typography>

        <TextField
          fullWidth
          placeholder="Search channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'rgba(255,255,255,0.7)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.05)',
              color: 'white',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#ff6b6b',
              },
            },
          }}
        />
      </Box>

      <Box
        className="channel-grid media-grid"
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}
      >
        {filteredChannels.length === 0 ? (
          <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              No channels found
            </Typography>
          </Box>
        ) : (
          filteredChannels.map((channel) => (
            <Box key={channel.id} 
              onMouseMove={(e) => {
                const card = e.currentTarget.querySelector('.card-3d');
                if (card) {
                  const rect = card.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const rotateX = (y - centerY) / 10;
                  const rotateY = (centerX - x) / 10;
                  (card as HTMLElement).style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                }
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget.querySelector('.card-3d');
                if (card) {
                  (card as HTMLElement).style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
                }
              }}
              sx={{ perspective: '1000px' }}
            >
              <Card
                className="card-3d"
                onClick={() => handleChannelClick(channel)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease-out',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  '&:hover': {
                    borderColor: 'rgba(255,107,107,0.3)',
                    boxShadow: '0 20px 60px rgba(255,107,107,0.4)',
                  },
                }}
              >
                <CardMedia
                  sx={{
                    height: 300,
                    position: 'relative',
                    bgcolor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  {channel.thumbnail ? (
                    <Box
                      component="img"
                      src={channel.thumbnail}
                      alt={channel.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <Person sx={{ fontSize: 80, color: 'rgba(255,255,255,0.3)' }} />
                    </Box>
                  )}
                </CardMedia>

                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'white',
                          fontWeight: 600,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {channel.name}
                      </Typography>
                      {channel.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255,255,255,0.5)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {channel.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${channel.subscriber_count.toLocaleString()} subscribers`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,107,107,0.1)',
                        color: '#ff6b6b',
                        border: '1px solid rgba(255,107,107,0.3)',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))
        )}
      </Box>
    </Container>
  );
};

export default Channels;

