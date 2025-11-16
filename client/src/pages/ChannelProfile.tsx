import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack, PlayArrow, Visibility, Group, PersonAdd, PersonRemove } from '@mui/icons-material';
import { Channel, Video } from '../lib/supabase';
import { channelService, videoService, channelSubscriptionService } from '../services/database';
import { useAuth } from '../components/Auth/AuthProvider';
import toast from 'react-hot-toast';
import SEO from '../components/SEO/SEO';

const ChannelProfile: React.FC = () => {
  const { channelName } = useParams<{ channelName: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    loadChannelData();
  }, [channelName]);

  useEffect(() => {
    if (channel && user?.username) {
      checkSubscription();
    }
  }, [channel, user?.username]);

  const loadChannelData = async () => {
    try {
      setLoading(true);
      
      // Load all channels and find the matching one
      const allChannels = await channelService.getAll();
      const foundChannel = allChannels.find(c => 
        c.name.toLowerCase().replace(/\s+/g, '-') === channelName?.toLowerCase()
      );
      
      if (foundChannel) {
        setChannel(foundChannel);
        
        // Load videos for this channel
        try {
          const allVideos = await videoService.getAll();
          const channelVideos = allVideos.filter(v => v.channel_id === foundChannel.id);
          setVideos(channelVideos);
        } catch (error) {
          console.error('Failed to load videos:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  const checkSubscription = async () => {
    if (!channel || !user?.username) return;
    
    try {
      const subscribed = await channelSubscriptionService.isSubscribed(user.username, channel.id);
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated || !user?.username || !channel) {
      toast.error('Please login to subscribe');
      return;
    }

    try {
      setSubscriptionLoading(true);
      
      if (isSubscribed) {
        await channelSubscriptionService.unsubscribe(user.username, channel.id);
        setIsSubscribed(false);
        toast.success('Unsubscribed successfully!');
      } else {
        await channelSubscriptionService.subscribe(user.username, channel.id);
        setIsSubscribed(true);
        toast.success('Subscribed successfully!');
      }
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!channel) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom>
            Channel Not Found
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/channels')}
          >
            Back to Channels
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      {/* Back Button */}
      <IconButton
        onClick={() => navigate('/channels')}
        sx={{ mb: 3 }}
      >
        <ArrowBack />
      </IconButton>

      {/* Channel Header */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4, 
        alignItems: { xs: 'center', md: 'flex-start' },
        bgcolor: 'rgba(255,255,255,0.03)',
        borderRadius: 4,
        padding: { xs: 2, md: 4 },
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Channel Logo */}
        <Box>
          {channel.thumbnail ? (
            <Box
              component="img"
              src={channel.thumbnail}
              alt={channel.name}
              sx={{
                maxWidth: { xs: '100%', md: 280 },
                width: 'auto',
                height: 'auto',
                maxHeight: { xs: 300, md: 400 },
                border: '4px solid rgba(255,107,107,0.5)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(255,107,107,0.3)',
                display: 'block',
              }}
            />
          ) : (
            <Box
              sx={{
                width: { xs: 200, md: 250 },
                height: { xs: 280, md: 350 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,107,107,0.2)',
                border: '4px solid rgba(255,107,107,0.5)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(255,107,107,0.3)',
              }}
            >
              <Group sx={{ fontSize: { xs: 80, md: 120 } }} />
            </Box>
          )}
        </Box>

        {/* Channel Info */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-start' }, justifyContent: 'space-between', mb: 2, gap: { xs: 2, md: 0 } }}>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '1.5rem', md: '2rem' }, textAlign: { xs: 'center', md: 'left' } }}>
              {channel.name.toUpperCase()}
            </Typography>
            
            {/* Subscribe Button */}
            {isAuthenticated && (
              <Button
                variant={isSubscribed ? 'outlined' : 'contained'}
                onClick={handleSubscribe}
                disabled={subscriptionLoading}
                startIcon={isSubscribed ? <PersonRemove /> : <PersonAdd />}
                sx={{
                  bgcolor: isSubscribed ? 'transparent' : 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
                  borderColor: '#ff6b6b',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: { xs: 3, md: 4 },
                  py: { xs: 1, md: 1.5 },
                  '&:hover': {
                    bgcolor: isSubscribed ? 'rgba(255,107,107,0.1)' : 'linear-gradient(135deg, #ff5555 0%, #ff7777 100%)',
                  },
                  '&:disabled': {
                    opacity: 0.6,
                  }
                }}
              >
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </Button>
            )}
          </Box>
          
          {channel.description && (
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
              {channel.description}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Chip
              icon={<Group />}
              label={`${channel.subscriber_count.toLocaleString()} Subscribers`}
              sx={{
                bgcolor: 'rgba(255,107,107,0.2)',
                color: '#ff6b6b',
                border: '1px solid rgba(255,107,107,0.3)',
                fontSize: '1rem',
                padding: '8px 16px',
                height: 'auto',
              }}
            />
            <Chip
              label={`${videos.length} Videos`}
              sx={{
                bgcolor: 'rgba(255,107,107,0.2)',
                color: '#ff6b6b',
                border: '1px solid rgba(255,107,107,0.3)',
                fontSize: '1rem',
                padding: '8px 16px',
                height: 'auto',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Videos Section */}
      {videos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            No videos found for this channel
          </Typography>
        </Box>
      ) : (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'white' }}>
            Videos
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
            {videos.map((video) => (
              <Box key={video.id}>
                <Card
                  onClick={() => handleVideoClick(video.id)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: 'rgba(255,107,107,0.3)',
                      boxShadow: '0 8px 32px rgba(255,107,107,0.2)',
                    },
                  }}
                >
                  <CardMedia
                    sx={{
                      height: 200,
                      position: 'relative',
                      bgcolor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {video.thumbnail ? (
                      <Box
                        component="img"
                        src={video.thumbnail}
                        alt={video.title}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
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
                        }}
                      >
                        <PlayArrow sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)' }} />
                      </Box>
                    )}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        px: 1,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption">
                        {video.duration || 'N/A'}
                      </Typography>
                    </Box>
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {video.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Visibility sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {video.views || 0}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(video.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default ChannelProfile;




