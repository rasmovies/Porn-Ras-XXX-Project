import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { 
  Edit, 
  Share, 
  Inbox, 
  VideoLibrary, 
  PhotoCamera, 
  Stream,
  ThumbUp,
  ThumbDown,
  Comment,
  Upload,
  Cake,
  Phone,
  CardMembership,
  LocalFireDepartment,
  Close,
  CloudUpload,
  LibraryBooks
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { profileService } from '../services/database';
import { Profile as ProfileType } from '../lib/supabase';
import { useAuth } from '../components/Auth/AuthProvider';

const ProfilePage: React.FC = () => {
  // Get user from auth context
  const { user: authUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState(2); // Stream tab active by default
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Load profile from Supabase on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileService.getByUsername(authUser?.username || '');
        if (profile) {
          if (profile.banner_image) {
            setBannerImage(profile.banner_image);
          }
          if (profile.avatar_image) {
            setAvatarImage(profile.avatar_image);
          }
        }
      } catch (error) {
        console.error('Failed to load profile from Supabase:', error);
      }
    };
    
    if (authUser?.username) {
      loadProfile();
    }
  }, [authUser?.username]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (bannerImage && bannerImage.startsWith('blob:')) {
        URL.revokeObjectURL(bannerImage);
      }
      if (avatarImage && avatarImage.startsWith('blob:')) {
        URL.revokeObjectURL(avatarImage);
      }
    };
  }, [bannerImage, avatarImage]);
  
  const user = {
    name: authUser?.username || 'guest',
    subscribers: '0',
    videosWatched: '1',
    avatar: null, // No avatar uploaded
  };

  const achievements = [
    {
      id: 1,
      name: '1 year old account',
      icon: <Cake sx={{ color: '#ffd700' }} />,
      description: 'mmc6135 unlocked a new achievement: "1 year old account"',
      timeAgo: '7 months ago',
      likes: 0
    },
    {
      id: 2,
      name: 'The Hand Held',
      icon: <Phone sx={{ color: '#2196f3' }} />,
      description: 'mmc6135 unlocked a new achievement: "The Hand Held"',
      timeAgo: '1 year ago',
      likes: 0
    },
    {
      id: 3,
      name: 'The Freshman',
      icon: <CardMembership sx={{ color: '#f44336' }} />,
      description: 'mmc6135 unlocked a new achievement: "The Freshman"',
      timeAgo: '1 year ago',
      likes: 0
    },
    {
      id: 4,
      name: 'Cherry Popper',
      icon: <LocalFireDepartment sx={{ color: '#f44336' }} />,
      description: 'mmc6135 unlocked a new achievement: "Cherry Popper"',
      timeAgo: '1 year ago',
      likes: 0
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📸 Banner upload başladı:', file.name);
      try {
        // Convert to base64 for Supabase
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Image = e.target?.result as string;
          console.log('📸 Base64 image oluşturuldu, uzunluk:', base64Image.length);
          
          // Set banner image to base64 string for immediate display
          setBannerImage(base64Image);
          console.log('📸 Banner image state güncellendi');
          
          try {
            // Save to Supabase
            const existingProfile: ProfileType | null = await profileService.getByUsername(authUser?.username || '');
            if (existingProfile) {
              console.log('📸 Profil bulundu, güncelleniyor...');
              // Update existing profile
              await profileService.update(existingProfile.id, {
                banner_image: base64Image
              });
              console.log('✅ Banner Supabase\'e kaydedildi');
            } else {
              console.log('📸 Yeni profil oluşturuluyor...');
              // Create new profile
              await profileService.upsert({
                user_name: authUser?.username || '',
                banner_image: base64Image,
                avatar_image: null,
                subscriber_count: 0,
                videos_watched: 1
              });
              console.log('✅ Yeni profil oluşturuldu');
            }
          } catch (error) {
            console.error('❌ Supabase kayıt hatası:', error);
          }
        };
        reader.readAsDataURL(file);
        
        // Don't scroll after closing modal
        setTimeout(() => {
          setShowCoverModal(false);
        }, 100);
      } catch (error) {
        console.error('❌ Görüntü yükleme hatası:', error);
      }
    } else {
      console.log('❌ Dosya seçilmedi');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Convert to base64 for Supabase
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Image = e.target?.result as string;
          
          // Set avatar image to base64 string for immediate display
          setAvatarImage(base64Image);
          
          try {
            // Save to Supabase
            const existingProfile: ProfileType | null = await profileService.getByUsername(authUser?.username || '');
            if (existingProfile) {
              // Update existing profile
              await profileService.update(existingProfile.id, {
                avatar_image: base64Image
              });
            } else {
              // Create new profile
              await profileService.upsert({
                user_name: authUser?.username || '',
                banner_image: null,
                avatar_image: base64Image,
                subscriber_count: 0,
                videos_watched: 1
              });
            }
          } catch (error) {
            console.error('Failed to save to Supabase:', error);
          }
        };
        reader.readAsDataURL(file);
        
        setShowAvatarModal(false);
      } catch (error) {
        console.error('Failed to upload avatar:', error);
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#0c0c0c' }}>
      {/* Header Banner */}
      <Box
        sx={{
          height: '300px',
          backgroundImage: bannerImage ? `url(${bannerImage})` : 'url(https://via.placeholder.com/1200x300/1a1a1a/ffffff?text=Banner+Image)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          pb: 3,
          overflow: 'hidden',
        }}
      >
        {/* Camera Icon for Banner Upload */}
        <IconButton
          onClick={() => {
            console.log('📸 Background yükleme butonu tıklandı');
            setShowCoverModal(true);
          }}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10000,
            bgcolor: 'rgba(255,107,107,0.8)',
            color: 'white',
            width: 56,
            height: 56,
            '&:hover': {
              bgcolor: 'rgba(255,107,107,1)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s',
            boxShadow: '0 4px 20px rgba(255,107,107,0.4)',
          }}
        >
          <PhotoCamera fontSize="large" />
        </IconButton>

        {/* Profile Picture Area */}
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            {/* Profile Picture */}
            <Box
              sx={{
                position: 'relative',
                cursor: 'pointer',
                '&:hover .avatar-camera-icon': {
                  opacity: 1,
                }
              }}
            >
              <Avatar
                onClick={() => setShowAvatarModal(true)}
                src={avatarImage || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  border: '4px solid #ff6b6b',
                  bgcolor: '#333',
                  fontSize: '3rem',
                  cursor: 'pointer',
                }}
              >
                {!avatarImage && <PhotoCamera />}
              </Avatar>
              <IconButton
                className="avatar-camera-icon"
                onClick={() => setShowAvatarModal(true)}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: '#ff6b6b',
                  color: 'white',
                  opacity: 0.7,
                  transition: 'opacity 0.3s',
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
            </Box>
            
            {/* User Info and Tabs */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                {user.name}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                {user.subscribers} Subscriber
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                {user.videosWatched} Videos Watched
              </Typography>
              
              {/* Navigation Tabs */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={activeTab === 0 ? 'contained' : 'text'}
                  sx={{
                    color: activeTab === 0 ? '#ff6b6b' : 'white',
                    bgcolor: activeTab === 0 ? 'rgba(255,107,107,0.1)' : 'transparent',
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setActiveTab(0)}
                >
                  Videos
                </Button>
                <Button
                  variant={activeTab === 1 ? 'contained' : 'text'}
                  sx={{
                    color: activeTab === 1 ? '#ff6b6b' : 'white',
                    bgcolor: activeTab === 1 ? 'rgba(255,107,107,0.1)' : 'transparent',
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setActiveTab(1)}
                >
                  Photos
                </Button>
                <Button
                  variant={activeTab === 2 ? 'contained' : 'text'}
                  sx={{
                    color: activeTab === 2 ? '#ff6b6b' : 'white',
                    bgcolor: activeTab === 2 ? 'rgba(255,107,107,0.1)' : 'transparent',
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                  onClick={() => setActiveTab(2)}
                >
                  Stream
                </Button>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ff6b6b',
                    bgcolor: 'rgba(255,107,107,0.1)',
                  }
                }}
              >
                Inbox
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  alert('Edit Profile özelliği yakında eklenecek!');
                }}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ff6b6b',
                    bgcolor: 'rgba(255,107,107,0.1)',
                  }
                }}
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ff6b6b',
                    bgcolor: 'rgba(255,107,107,0.1)',
                  }
                }}
              >
                Share
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Left Column - Main Content */}
          <Box sx={{ flex: 2 }}>
            {/* Post to Stream Button */}
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 2,
                px: 4,
                py: 1.5,
                mb: 3,
                boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ff5555 0%, #ff7777 100%)',
                  boxShadow: '0 0 30px rgba(255, 107, 107, 0.5)',
                }
              }}
            >
              Post to your stream
            </Button>

            {/* Filter Options */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  textTransform: 'none',
                }}
              >
                All Posts
              </Button>
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  textTransform: 'none',
                }}
              >
                View All
              </Button>
            </Box>

            {/* Stream Entries */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Paper
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          border: '2px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {achievement.icon}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                          <Box component="span" sx={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                            {user.name}
                          </Box>{' '}
                          {achievement.description}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                          {achievement.timeAgo}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            {achievement.likes}
                          </Typography>
                          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            <ThumbUp fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            <ThumbDown fontSize="small" />
                          </IconButton>
                          <Button
                            size="small"
                            sx={{
                              color: 'rgba(255,255,255,0.6)',
                              textTransform: 'none',
                              ml: 1,
                            }}
                          >
                            Comment
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* Right Column - Sidebar */}
          <Box sx={{ flex: 1, minWidth: '300px' }}>
            {/* Achievements Section */}
            <Paper
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                p: 3,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Achievements (4)
                </Typography>
                <Button
                  size="small"
                  sx={{
                    color: '#ff6b6b',
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  View All
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {achievements.map((achievement) => (
                  <Avatar
                    key={achievement.id}
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      border: '2px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    {achievement.icon}
                  </Avatar>
                ))}
              </Box>
            </Paper>


          </Box>
        </Box>
      </Container>

      {/* Edit Cover Photo Modal */}
      <Dialog 
        open={showCoverModal} 
        onClose={() => setShowCoverModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white',
            zIndex: 1300,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)' 
        }}>
          <Typography variant="h6">Edit Cover Photo</Typography>
          <IconButton onClick={() => setShowCoverModal(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="upload-image"
              type="file"
              onChange={handleBannerUpload}
            />
            <label htmlFor="upload-image">
              <Button
                variant="contained"
                component="span"
                fullWidth
                startIcon={<CloudUpload />}
                sx={{
                  bgcolor: '#2a2a2a',
                  color: 'white',
                  py: 2,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#333',
                  }
                }}
              >
                Upload Image
              </Button>
            </label>
            
            <Button
              variant="contained"
              fullWidth
              startIcon={<LibraryBooks />}
              sx={{
                bgcolor: '#2a2a2a',
                color: 'white',
                py: 2,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#333',
                }
              }}
              onClick={() => {
                alert('Library feature coming soon!');
              }}
            >
              Select From Library
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2, textAlign: 'center' }}>
            Recommended image size 1323 by 270px or larger.
          </Typography>
        </DialogContent>
      </Dialog>
      
      {/* Avatar Upload Modal */}
      <Dialog
        open={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(20, 20, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 107, 107, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Upload Avatar Photo
          </Typography>
          <IconButton onClick={() => setShowAvatarModal(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="upload-avatar"
              type="file"
              onChange={handleAvatarUpload}
            />
            <label htmlFor="upload-avatar">
              <Button
                variant="contained"
                component="span"
                fullWidth
                startIcon={<CloudUpload />}
                sx={{
                  bgcolor: '#2a2a2a',
                  color: 'white',
                  py: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  border: '2px dashed rgba(255,107,107,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,107,107,0.1)',
                    border: '2px dashed #ff6b6b',
                  },
                }}
              >
                Upload Avatar Photo
              </Button>
            </label>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2, textAlign: 'center' }}>
              Recommended image size: 300x300px or larger.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;