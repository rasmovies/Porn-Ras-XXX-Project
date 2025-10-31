import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { Grid } from '@mui/material';
import { Search as SearchIcon, FilterList } from '@mui/icons-material';
import VideoCard from '../components/Video/VideoCard';

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const mockVideos = [
    {
      id: 1,
      title: 'Search Result 1',
      thumbnail: 'https://via.placeholder.com/300x169/ff6b6b/ffffff?text=Result+1',
      views: '456K',
      duration: '8:32',
      category: 'Romance',
    },
    {
      id: 2,
      title: 'Search Result 2',
      thumbnail: 'https://via.placeholder.com/300x169/4ecdc4/ffffff?text=Result+2',
      views: '789K',
      duration: '12:15',
      category: 'Drama',
    },
    {
      id: 3,
      title: 'Search Result 3',
      thumbnail: 'https://via.placeholder.com/300x169/45b7d1/ffffff?text=Result+3',
      views: '234K',
      duration: '6:45',
      category: 'Comedy',
    },
    {
      id: 4,
      title: 'Search Result 4',
      thumbnail: 'https://via.placeholder.com/300x169/96ceb4/ffffff?text=Result+4',
      views: '1.2M',
      duration: '15:22',
      category: 'Action',
    },
  ];

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
          Search Results for "{searchQuery || 'all videos'}"
        </Typography>
        
        <Grid container spacing={3}>
          {mockVideos.map((video) => (
            <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.333%', lg: '25%' }, mb: 2 }} key={video.id}>
              <Card sx={{ cursor: 'pointer' }}>
                <CardMedia
                  component="img"
                  height="169"
                  image={video.thumbnail}
                  alt={video.title}
                />
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom noWrap>
                    {video.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={video.category} size="small" color="primary" />
                    <Chip label={video.duration} size="small" color="secondary" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {video.views} views
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Channels
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No channels found. Try searching for something else.
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Categories
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No categories found. Try searching for something else.
        </Typography>
      </TabPanel>
    </Container>
  );
};

export default Search;
