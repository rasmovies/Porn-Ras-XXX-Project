import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon, FilterList, Person, VideoLibrary } from '@mui/icons-material';
import { Channel, Category, Video } from '../lib/supabase';
import { channelService, categoryService, videoService } from '../services/database';
import { motion } from 'motion/react';
import SEO from '../components/SEO/SEO';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (tabValue === 0) {
      loadVideos();
    }
  }, [tabValue]);

  useEffect(() => {
    if (tabValue === 1) {
      loadChannels();
    }
  }, [tabValue]);

  useEffect(() => {
    if (tabValue === 2) {
      loadCategories();
    }
  }, [tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const loadVideos = async () => {
    if (videos.length > 0) return; // Already loaded
    try {
      setLoadingVideos(true);
      const data = await videoService.getAll();
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadChannels = async () => {
    if (channels.length > 0) return; // Already loaded
    try {
      setLoadingChannels(true);
      const data = await channelService.getAll();
      setChannels(data);
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadCategories = async () => {
    if (categories.length > 0) return; // Already loaded
    try {
      setLoadingCategories(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleChannelClick = (channel: Channel) => {
    const channelSlug = channel.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/channels/${channelSlug}`);
  };

  const handleCategoryClick = (category: Category) => {
    const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/categories/${categorySlug}`);
  };

  const filteredChannels = searchQuery
    ? channels.filter(channel =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : channels;

  const filteredCategories = searchQuery
    ? categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  const filteredVideos = searchQuery
    ? videos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Search Videos
      </Typography>

      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search for videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />,
          }}
        />
        <Button variant="contained" size="large">
          Search
        </Button>
        <Button variant="outlined" startIcon={<FilterList />}>
          Filters
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Videos" />
          <Tab label="Channels" />
          <Tab label="Categories" />
        </Tabs>
      </Box>

      {/* Search Results */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'All Videos'}
        </Typography>
        {loadingVideos ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredVideos.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No videos found. Try searching for something else.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
            {filteredVideos.map((video) => (
              <Box key={video.id}>
                <Card
                  onClick={() => navigate(`/video/${video.slug || video.id}`)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(255,107,107,0.3)',
                      boxShadow: '0 20px 60px rgba(255,107,107,0.4)',
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <CardMedia
                    sx={{
                      height: 200,
                      position: 'relative',
                      bgcolor: 'rgba(0,0,0,0.1)',
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
                          bgcolor: 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <VideoLibrary sx={{ fontSize: 80, color: 'rgba(255,255,255,0.3)' }} />
                      </Box>
                    )}
                  </CardMedia>

                  <CardContent sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {video.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {video.views?.toLocaleString() || '0'} views
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'All Channels'}
        </Typography>
        {loadingChannels ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredChannels.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No channels found. Try searching for something else.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
            {filteredChannels.map((channel) => (
              <Box key={channel.id} 
                sx={{ perspective: '1000px' }}
              >
                <Card
                  onClick={() => handleChannelClick(channel)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    '&:hover': {
                      borderColor: 'rgba(255,107,107,0.3)',
                      boxShadow: '0 20px 60px rgba(255,107,107,0.4)',
                      transform: 'translateY(-8px)',
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
            ))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'All Categories'}
        </Typography>
        {loadingCategories ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredCategories.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No categories found. Try searching for something else.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
              >
                <Card
                  onClick={() => handleCategoryClick(category)}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'transparent',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.5)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '133.33%', // 3:4 aspect ratio
                      overflow: 'hidden',
                      bgcolor: 'rgba(0,0,0,0.1)',
                    }}
                  >
                    {category.thumbnail ? (
                      <Box
                        component="img"
                        src={category.thumbnail}
                        alt={category.name}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          }
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(102, 126, 234, 0.2)',
                        }}
                      >
                        <VideoLibrary sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)' }} />
                      </Box>
                    )}
                  </Box>

                  {/* Category Info */}
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        mb: 1,
                        fontSize: '16px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {category.name}
                    </Typography>
                  </Box>
                </Card>
              </motion.div>
            ))}
          </Box>
        )}
      </TabPanel>
    </Container>
  );
};

export default Search;
