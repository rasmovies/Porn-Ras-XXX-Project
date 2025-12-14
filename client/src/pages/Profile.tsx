import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Button,
  IconButton,
  Paper,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  CircularProgress,
  Slider,
} from '@mui/material';
import { 
  Cake,
  Phone,
  CardMembership,
  LocalFireDepartment,
  Close,
  CloudUpload,
  Article,
  Gif,
  PlaylistPlay,
  Tv,
  PhotoCamera,
  LibraryBooks,
  Delete,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { profileService, subscriptionService, channelSubscriptionService, userPostService, userGifService, userPlaylistService, videoService, modelService, backgroundImageService } from '../services/database';
import { Profile as ProfileType, Model, Channel, UserPost, UserGif, UserPlaylist, Video, BackgroundImage } from '../lib/supabase';
import { useAuth } from '../components/Auth/AuthProvider';
import { toast } from 'react-hot-toast';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getImageMimeType = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
  return matches ? matches[1] : 'image/jpeg';
};

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context could not be retrieved');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  const mimeType = getImageMimeType(imageSrc);
  return canvas.toDataURL(mimeType, 1);
};

const ProfilePage: React.FC = () => {
  // Get user from auth context
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  
  const normalizedUsername = (authUser?.username || authUser?.name || '').trim().toLowerCase();
  const canUploadLibraryImages = normalizedUsername === 'pornras admin';
  
  const [activeTab, setActiveTab] = useState(0); // Posts tab active by default
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<BackgroundImage[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibraryImage, setSelectedLibraryImage] = useState<BackgroundImage | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedLibraryImage, setCroppedLibraryImage] = useState<string | null>(null);
  const [pornstarSubscriptions, setPornstarSubscriptions] = useState<Array<{ model: Model }>>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [channelSubscriptions, setChannelSubscriptions] = useState<Array<{ channel: Channel }>>([]);
  const [loadingChannelSubscriptions, setLoadingChannelSubscriptions] = useState(false);
  
  // New state for posts, GIFs, and playlists
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [gifs, setGifs] = useState<UserGif[]>([]);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showGifDialog, setShowGifDialog] = useState(false);
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistVideos, setPlaylistVideos] = useState<Video[]>([]);
  const [showGifDetailDialog, setShowGifDetailDialog] = useState(false);
  const [selectedGif, setSelectedGif] = useState<UserGif | null>(null);
  const [gifDetailDescription, setGifDetailDescription] = useState('');
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');

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
          // Set edit values
          setEditUsername(authUser?.username || '');
          setEditEmail(authUser?.email || '');
          setEditBio(profile.bio || '');
        } else {
          // Set default values if no profile
          setEditUsername(authUser?.username || '');
          setEditEmail(authUser?.email || '');
          setEditBio('');
        }
      } catch (error) {
        console.error('Failed to load profile from Supabase:', error);
        // Set default values on error
        setEditUsername(authUser?.username || '');
        setEditEmail(authUser?.email || '');
        setEditBio('');
      }
    };
    
    if (authUser?.username) {
      loadProfile();
    }
  }, [authUser?.username, authUser?.email]);

  // Load pornstar subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!authUser?.username) return;
      
      try {
        setLoadingSubscriptions(true);
        const subscriptions = await subscriptionService.getByUser(authUser.username);
        setPornstarSubscriptions(subscriptions);
      } catch (error) {
        console.error('Failed to load subscriptions:', error);
      } finally {
        setLoadingSubscriptions(false);
      }
    };
    
    if (authUser?.username) {
      loadSubscriptions();
    }
  }, [authUser?.username]);

  // Load channel subscriptions
  useEffect(() => {
    const loadChannelSubscriptions = async () => {
      if (!authUser?.username) return;
      
      try {
        setLoadingChannelSubscriptions(true);
        const subscriptions = await channelSubscriptionService.getByUser(authUser.username);
        setChannelSubscriptions(subscriptions);
      } catch (error) {
        console.error('Failed to load channel subscriptions:', error);
      } finally {
        setLoadingChannelSubscriptions(false);
      }
    };
    
    if (authUser?.username) {
      loadChannelSubscriptions();
    }
  }, [authUser?.username]);

  const handleModelClick = (model: Model) => {
    const modelSlug = model.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/models/${modelSlug}`);
  };

  const handleChannelClick = (channel: Channel) => {
    const channelSlug = channel.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/channels/${channelSlug}`);
  };

  // Load posts, GIFs, and playlists
  useEffect(() => {
    const loadData = async () => {
      if (!authUser?.username) return;
      
      try {
        const [postsData, gifsData, playlistsData, allVideos, modelsData] = await Promise.all([
          userPostService.getByUser(authUser.username),
          userGifService.getByUser(authUser.username),
          userPlaylistService.getByUser(authUser.username),
          videoService.getAll(),
          modelService.getAll()
        ]);
        console.log('Loaded GIFs:', gifsData);
        console.log('Loaded Models:', modelsData);
        setPosts(postsData);
        setGifs(gifsData);
        setPlaylists(playlistsData);
        setPlaylistVideos(allVideos);
        setAllModels(modelsData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };
    
    loadData();
  }, [authUser?.username]);

  // Post handlers
  const handlePostSubmit = async () => {
    if (!authUser?.username || !newPostContent.trim()) return;
    
    try {
      const newPost = await userPostService.create({
        user_name: authUser.username,
        content: newPostContent
      });
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setShowPostDialog(false);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    }
  };

  // GIF handlers
  const handleGifSubmit = async () => {
    if (!authUser?.username || !gifFile) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await userGifService.create({
          user_name: authUser.username,
          gif_url: '',
          gif_file_base64: base64
        });
        setGifFile(null);
        setShowGifDialog(false);
        toast.success('GIF uploaded! Pending admin approval.');
        
        // Reload GIFs
        const updatedGifs = await userGifService.getByUser(authUser.username);
        setGifs(updatedGifs);
      };
      reader.readAsDataURL(gifFile);
    } catch (error) {
      console.error('Failed to upload GIF:', error);
      toast.error('Failed to upload GIF');
    }
  };

  // Playlist handlers
  const handlePlaylistSubmit = async () => {
    if (!authUser?.username || !newPlaylistName.trim()) return;
    
    try {
      await userPlaylistService.create({
        user_name: authUser.username,
        playlist_name: newPlaylistName,
        video_ids: []
      });
      setNewPlaylistName('');
      setShowPlaylistDialog(false);
      toast.success('Playlist created successfully!');
      
      // Reload playlists
      const updatedPlaylists = await userPlaylistService.getByUser(authUser.username);
      setPlaylists(updatedPlaylists);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist');
    }
  };

  // Handle Edit Profile
  const handleEditProfileOpen = () => {
    setEditUsername(authUser?.username || '');
    setEditEmail(authUser?.email || '');
    // Load bio from profile if exists
    profileService.getByUsername(authUser?.username || '').then(profile => {
      if (profile) {
        setEditBio(profile.bio || '');
      }
    }).catch(() => {
      setEditBio('');
    });
    setEditProfileDialogOpen(true);
  };

  const handleEditProfileSave = async () => {
    if (!authUser?.username) return;

    try {
      const existingProfile = await profileService.getByUsername(authUser.username);
      
      if (existingProfile) {
        // Update existing profile
        await profileService.update(existingProfile.id, {
          bio: editBio,
          // Note: username and email updates would require auth system changes
          // For now, we only update bio
        });
      } else {
        // Create new profile
        await profileService.upsert({
          user_name: editUsername || authUser.username,
          bio: editBio,
          subscriber_count: 0,
          videos_watched: 0
        });
      }
      
      toast.success('Profile updated successfully!');
      setEditProfileDialogOpen(false);
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

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

  const normalizeImageData = (imageData: string) =>
    imageData?.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;

  const handleSelectLibraryImage = (image: BackgroundImage) => {
    const imageUrl = normalizeImageData(image.image_data);
    setSelectedLibraryImage(image);
    setCroppingImage(imageUrl);
    setCroppedLibraryImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleOpenImageLibrary = async () => {
    setShowImageLibrary(true);
    setSelectedLibraryImage(null);
    setCroppingImage(null);
    setCroppedLibraryImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setLibraryError(null);

    try {
      setLibraryLoading(true);
      const images = await backgroundImageService.getAll();
      setLibraryImages(images);
      if (images.length > 0) {
        handleSelectLibraryImage(images[0]);
      } else {
        setLibraryError('Kütüphanede kayıtlı görsel bulunamadı.');
      }
    } catch (error) {
      console.error('❌ Kütüphane görselleri yüklenemedi:', error);
      setLibraryError('Görsel kütüphanesi yüklenemedi.');
    } finally {
      setLibraryLoading(false);
    }
  };

  const onCropComplete = useCallback((_: Area, croppedArea: Area) => {
    setCroppedAreaPixels(croppedArea);
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (!croppingImage || !croppedAreaPixels) {
      toast.error('Kırpma için görsel ve alan seçmelisiniz.');
      return;
    }
    try {
      const cropped = await getCroppedImg(croppingImage, croppedAreaPixels);
      setCroppedLibraryImage(cropped);
      toast.success('Kırpma uygulandı.');
    } catch (error) {
      console.error('❌ Kırpma hatası:', error);
      toast.error('Kırpma sırasında bir hata oluştu.');
    }
  }, [croppingImage, croppedAreaPixels]);

  const handleLibrarySave = async () => {
    if (!selectedLibraryImage && !croppedLibraryImage) return;
    if (!authUser?.username) {
      toast.error('Devam etmek için giriş yapmalısınız.');
      return;
    }

    const imageUrl = croppedLibraryImage
      || (selectedLibraryImage ? normalizeImageData(selectedLibraryImage.image_data) : null);

    if (!imageUrl) {
      toast.error('Lütfen kütüphaneden bir görsel seçin.');
      return;
    }

    setBannerImage(imageUrl);

    try {
      const existingProfile: ProfileType | null = await profileService.getByUsername(authUser.username);
      if (existingProfile) {
        await profileService.update(existingProfile.id, { banner_image: imageUrl });
      } else {
        await profileService.upsert({
          user_name: authUser.username,
          banner_image: imageUrl,
          avatar_image: null,
          subscriber_count: 0,
          videos_watched: 1,
        });
      }
      toast.success('Kapak görseli güncellendi.');
      setShowImageLibrary(false);
      setShowCoverModal(false);
      setCroppedLibraryImage(null);
      setCroppingImage(null);
    } catch (error) {
      console.error('❌ Kütüphane görseli kaydedilemedi:', error);
      toast.error('Görsel kaydedilemedi.');
    }
  };

  const handleDeleteLibraryImage = async (image: BackgroundImage) => {
    if (!canUploadLibraryImages) {
      toast.error('Sadece Pornras Admin görsel silebilir.');
      return;
    }
    try {
      await backgroundImageService.delete(image.id);
      setLibraryImages((prev) => {
        const updated = prev.filter((item) => item.id !== image.id);
        if (selectedLibraryImage?.id === image.id) {
          if (updated.length > 0) {
            handleSelectLibraryImage(updated[0]);
          } else {
            setSelectedLibraryImage(null);
            setCroppingImage(null);
            setCroppedLibraryImage(null);
            setCroppedAreaPixels(null);
            setLibraryError('Kütüphanede kayıtlı görsel bulunamadı.');
          }
        }
        return updated;
      });
      toast.success('Görsel silindi.');
    } catch (error) {
      console.error('❌ Görsel silinemedi:', error);
      toast.error('Görsel silinemedi.');
    }
  };

  const handleLibraryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = event.target;
    const files = Array.from(inputElement.files || []);
    if (files.length === 0) return;

    if (!authUser?.username) {
      toast.error('Devam etmek için giriş yapmalısınız.');
      inputElement.value = '';
      return;
    }

    if (!canUploadLibraryImages) {
      toast.error('Sadece Pornras Admin yeni görsel yükleyebilir.');
      inputElement.value = '';
      return;
    }

    try {
      setLibraryLoading(true);
      for (const file of files) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Dosya okunamadı'));
          reader.readAsDataURL(file);
        });

        let width: number | undefined;
        let height: number | undefined;
        try {
          const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = () => reject(new Error('Görsel boyutları okunamadı'));
            img.src = base64;
          });
          width = dimensions.width;
          height = dimensions.height;
        } catch (dimensionError) {
          console.warn('Görsel boyutları alınamadı:', dimensionError);
        }

        await backgroundImageService.create(file.name, base64, file.size, width, height);
      }

      const images = await backgroundImageService.getAll();
      setLibraryImages(images);
      if (images.length > 0) {
        handleSelectLibraryImage(images[0]);
      }
      setLibraryError(null);
      toast.success('Görseller kütüphaneye eklendi.');
    } catch (error) {
      console.error('❌ Kütüphane görseli eklenemedi:', error);
      setLibraryError('Görseller eklenemedi.');
    } finally {
      setLibraryLoading(false);
      inputElement.value = '';
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
          position: 'relative',
          width: { xs: '100%', md: '1323px' },
          height: { xs: 180, md: 270 },
          mx: 'auto',
          backgroundImage: bannerImage
            ? `url(${bannerImage})`
            : 'url(https://via.placeholder.com/1323x270/1a1a1a/ffffff?text=Banner+Image)',
          backgroundSize: { xs: 'cover', md: 'auto' },
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'flex-end',
          pb: { xs: 2, md: 3 },
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
            top: { xs: 8, md: 16 },
            right: { xs: 8, md: 16 },
            zIndex: 10000,
            bgcolor: 'rgba(255,107,107,0.8)',
            color: 'white',
            width: { xs: 48, md: 56 },
            height: { xs: 48, md: 56 },
            '&:hover': {
              bgcolor: 'rgba(255,107,107,1)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s',
            boxShadow: '0 4px 20px rgba(255,107,107,0.4)',
          }}
        >
          <PhotoCamera />
        </IconButton>

        {/* Profile Picture Area */}
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 3 }}>
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
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  border: '4px solid #ff6b6b',
                  bgcolor: '#333',
                  fontSize: { xs: '2rem', md: '3rem' },
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
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {user.name}
              </Typography>
              <Box sx={{ height: 16 }} />
              
              {/* Navigation Tabs */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant={activeTab === 0 ? 'contained' : 'text'}
                  sx={{
                    color: 'white',
                    bgcolor: activeTab === 0 ? 'rgba(255,107,107,0.3)' : 'rgba(255,107,107,0.2)',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    minWidth: 'auto',
                    '&:hover': {
                      bgcolor: 'rgba(255,107,107,0.4)',
                    },
                  }}
                  onClick={() => setActiveTab(0)}
                  startIcon={<Article />}
                >
                  Posts
                </Button>
                <Button
                  variant={activeTab === 3 ? 'contained' : 'text'}
                  sx={{
                    color: 'white',
                    bgcolor: activeTab === 3 ? 'rgba(255,107,107,0.3)' : 'rgba(255,107,107,0.2)',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    minWidth: 'auto',
                    '&:hover': {
                      bgcolor: 'rgba(255,107,107,0.4)',
                    },
                  }}
                  onClick={() => setActiveTab(3)}
                  startIcon={<PlaylistPlay />}
                >
                  Playlist
                </Button>
                <Button
                  variant={activeTab === 2 ? 'contained' : 'text'}
                  sx={{
                    color: 'white',
                    bgcolor: activeTab === 2 ? 'rgba(255,107,107,0.3)' : 'rgba(255,107,107,0.2)',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    minWidth: 'auto',
                    '&:hover': {
                      bgcolor: 'rgba(255,107,107,0.4)',
                    },
                  }}
                  onClick={() => setActiveTab(2)}
                  startIcon={<Gif />}
                >
                  GIFs
                </Button>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/chat')}
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
                onClick={handleEditProfileOpen}
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
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
          {/* Left Column - Main Content */}
          <Box sx={{ flex: { xs: 1, lg: 2 } }}>
            {/* Tab Content Based on Active Tab */}
            {activeTab === 0 && (
              <>
                {/* Posts Tab */}
                <Button
                  variant="contained"
                  onClick={() => setShowPostDialog(true)}
                  fullWidth
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
                  New post
                </Button>
                {posts.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                      Posts
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {posts.map((post) => (
                        <Paper
                          key={post.id}
                          sx={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 3,
                          }}
                        >
                          <Typography variant="body1" sx={{ color: 'white', mb: 1, whiteSpace: 'pre-wrap' }}>
                            {post.content}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {new Date(post.created_at).toLocaleString()}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}

            {activeTab === 2 && (
              <>
                {/* GIFs Tab */}
                <Button
                  variant="contained"
                  onClick={() => setShowGifDialog(true)}
                  fullWidth
                  sx={{
                    background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                    color: 'white',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    mb: 3,
                    boxShadow: '0 0 20px rgba(78, 205, 196, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #44a08d 0%, #3d8f7e 100%)',
                      boxShadow: '0 0 30px rgba(78, 205, 196, 0.5)',
                    }
                  }}
                >
                  Upload GIF
                </Button>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                    GIFs
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {gifs.filter(gif => gif.is_approved).length === 0 ? (
                      <Paper
                        sx={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 2,
                          p: 3,
                        }}
                      >
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          No GIFs uploaded yet.
                        </Typography>
                      </Paper>
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                        {gifs.filter(gif => gif.is_approved).map((gif) => (
                          <Paper
                            key={gif.id}
                            onClick={() => {
                              setSelectedGif(gif);
                              setGifDetailDescription('');
                              setSelectedModelIds([]);
                              setShowGifDetailDialog(true);
                            }}
                            sx={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: 2,
                              p: 1,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.3s',
                              '&:hover': {
                                borderColor: '#ff6b6b',
                                transform: 'scale(1.02)',
                              }
                            }}
                          >
                            {gif.gif_file_base64 && (
                              <Box
                                component="img"
                                src={gif.gif_file_base64}
                                alt="GIF"
                                sx={{ width: '100%', height: 'auto', display: 'block' }}
                              />
                            )}
                          </Paper>
                        ))}
                      </Box>
                    )}
                    {gifs.filter(gif => !gif.is_approved).length > 0 && (
                      <Paper
                        sx={{
                          background: 'rgba(255, 215, 0, 0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center',
                          mt: 2,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                          {gifs.filter(gif => !gif.is_approved).length} GIF(s) pending approval
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </Box>
              </>
            )}

            {activeTab === 3 && (
              <>
                {/* Playlist Tab */}
                {playlists.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                      Playlists
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {playlists.map((playlist) => (
                        <Paper
                          key={playlist.id}
                          sx={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 3,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            '&:hover': {
                              borderColor: '#ff6b6b',
                              bgcolor: 'rgba(255,107,107,0.05)',
                            }
                          }}
                          onClick={() => {
                            // Navigate to playlist view
                            alert(`Playlist: ${playlist.playlist_name}\nVideos: ${playlist.video_ids.length}`);
                          }}
                        >
                          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                            {playlist.playlist_name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {playlist.video_ids.length} video(s)
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}

          </Box>

          {/* Right Column - Sidebar */}
          <Box sx={{ flex: 1 }}>
            {/* Playlists Section */}
            <Paper
              onClick={() => setShowPlaylistDialog(true)}
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                p: { xs: 2, md: 3 },
                mb: 3,
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative',
                minHeight: 148,
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  borderColor: '#ff6b6b',
                  bgcolor: 'rgba(255,107,107,0.05)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative', zIndex: 2 }}>
                <Avatar
                  sx={{
                    width: { xs: 40, md: 50 },
                    height: { xs: 40, md: 50 },
                    bgcolor: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    mr: 2,
                  }}
                >
                  <PlaylistPlay sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, color: '#ff6b6b' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
                    Playlists
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ff6b6b', fontSize: '0.85rem' }}>
                    Browse latest videos and click [+] to create a custom playlist
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'blur(5px)',
                  pointerEvents: 'none',
                }}
              >
                <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 'bold' }}>
                  Coming Soon
                </Typography>
              </Box>
            </Paper>
            
            {/* Pornstar Subscriptions Section */}
            <Paper
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                p: { xs: 2, md: 3 },
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: { xs: 40, md: 50 },
                    height: { xs: 40, md: 50 },
                    bgcolor: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    mr: 2,
                  }}
                >
                  <LocalFireDepartment sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, color: '#ff6b6b' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
                    Pornstar Subscriptions
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ff6b6b', fontSize: '0.85rem' }}>
                    Subscribe to keep up to date with the hottest stars
                  </Typography>
                </Box>
              </Box>
              
              {/* Subscribed Models Grid */}
              {loadingSubscriptions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</Typography>
                </Box>
              ) : pornstarSubscriptions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    No subscriptions yet
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                  {pornstarSubscriptions.map((sub) => (
                    <Card
                      key={sub.model.id}
                      onClick={() => handleModelClick(sub.model)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: '#ff6b6b',
                          bgcolor: 'rgba(255,107,107,0.05)',
                          transform: 'translateY(-4px)',
                        }
                      }}
                    >
                      <CardMedia
                        sx={{
                          height: 120,
                          position: 'relative',
                          bgcolor: 'rgba(255,255,255,0.05)',
                        }}
                      >
                        {sub.model.image ? (
                          <Box
                            component="img"
                            src={sub.model.image}
                            alt={sub.model.name}
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
                            <LocalFireDepartment sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
                          </Box>
                        )}
                      </CardMedia>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'white',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                          }}
                        >
                          {sub.model.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>

            {/* Channel Subscriptions Section */}
            <Paper
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                p: { xs: 2, md: 3 },
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: { xs: 40, md: 50 },
                    height: { xs: 40, md: 50 },
                    bgcolor: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    mr: 2,
                  }}
                >
                  <Tv sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, color: '#ff6b6b' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
                    Channel Subscriptions
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ff6b6b', fontSize: '0.85rem' }}>
                    Discover Channels
                  </Typography>
                </Box>
              </Box>
              
              {/* Subscribed Channels Grid */}
              {loadingChannelSubscriptions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</Typography>
                </Box>
              ) : channelSubscriptions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    No channel subscriptions yet
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                  {channelSubscriptions.map((sub) => (
                    <Card
                      key={sub.channel.id}
                      onClick={() => handleChannelClick(sub.channel)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: '#ff6b6b',
                          bgcolor: 'rgba(255,107,107,0.05)',
                          transform: 'translateY(-4px)',
                        }
                      }}
                    >
                      <CardMedia
                        sx={{
                          height: 120,
                          position: 'relative',
                          bgcolor: 'rgba(255,255,255,0.05)',
                        }}
                      >
                        {sub.channel.thumbnail ? (
                          <Box
                            component="img"
                            src={sub.channel.thumbnail}
                            alt={sub.channel.name}
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
                            <Tv sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
                          </Box>
                        )}
                      </CardMedia>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'white',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                          }}
                        >
                          {sub.channel.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>

            {/* Achievements Section */}
            <Paper
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                p: 3,
                mb: 3,
                position: 'relative',
                minHeight: 148,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, position: 'relative', zIndex: 2 }}>
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
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'blur(5px)',
                  pointerEvents: 'none',
                }}
              >
                <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 'bold' }}>
                  Coming Soon
                </Typography>
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
              onClick={handleOpenImageLibrary}
            >
              Select From Library
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 2, textAlign: 'center' }}>
            Recommended image size 1323 by 270px.
          </Typography>
        </DialogContent>
      </Dialog>
      
      {/* Image Library Modal */}
      <Dialog
        open={showImageLibrary}
        onClose={() => setShowImageLibrary(false)}
        maxWidth="md"
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
        <DialogTitle
          sx={{
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Typography variant="h6">Select Cover Image</Typography>
          <IconButton onClick={() => setShowImageLibrary(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <input
            id="library-upload-input"
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleLibraryUpload}
          />
          {canUploadLibraryImages && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => document.getElementById('library-upload-input')?.click()}
                sx={{ textTransform: 'none' }}
                disabled={libraryLoading}
              >
                Upload to Library
              </Button>
            </Box>
          )}
          {croppingImage && (
            <>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: { xs: 220, md: 320 },
                  bgcolor: 'rgba(0,0,0,0.7)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 2,
                }}
              >
                <Cropper
                  image={croppingImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1323 / 270}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  restrictPosition={false}
                  cropShape="rect"
                  showGrid={false}
                />
              </Box>
              <Box sx={{ px: 1, mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Zoom
                </Typography>
                <Slider
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(_, value) => setZoom(value as number)}
                  sx={{ color: '#ff6b6b' }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleApplyCrop}
                  disabled={!croppingImage || !croppedAreaPixels}
                  sx={{ textTransform: 'none' }}
                >
                  Apply Crop
                </Button>
              </Box>
            </>
          )}
          {libraryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : libraryError ? (
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', py: 4 }}>
              {libraryError}
            </Typography>
          ) : libraryImages.length > 0 ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              {libraryImages.map((image) => {
                const imageUrl = normalizeImageData(image.image_data);
                const isSelected = selectedLibraryImage?.id === image.id;
                return (
                  <Box
                    key={image.id}
                    onClick={() => handleSelectLibraryImage(image)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: isSelected ? '2px solid #ff6b6b' : '2px solid transparent',
                      position: 'relative',
                      transition: 'border-color 0.2s ease',
                      '&:hover': {
                        borderColor: '#ff6b6b',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={imageUrl}
                      alt={image.name}
                      loading="lazy"
                      sx={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        px: 1.5,
                        py: 0.75,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
                        {image.name}
                      </Typography>
                    </Box>
                    {canUploadLibraryImages && (
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteLibraryImage(image);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(255,107,107,0.8)' },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', py: 4 }}>
              Kütüphanede kayıtlı görsel bulunamadı.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowImageLibrary(false)}
            sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleLibrarySave}
            disabled={!selectedLibraryImage || libraryLoading}
            sx={{ textTransform: 'none' }}
          >
            Save Selection
          </Button>
        </DialogActions>
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

      {/* Post Dialog */}
      <Dialog open={showPostDialog} onClose={() => setShowPostDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a1a1a', color: 'white' }}>
          Create Post
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a1a' }}>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind?"
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a1a1a' }}>
          <Button onClick={() => setShowPostDialog(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button onClick={handlePostSubmit} variant="contained" sx={{ bgcolor: '#ff6b6b', '&:hover': { bgcolor: '#ff5252' } }}>
            Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* GIF Upload Dialog */}
      <Dialog open={showGifDialog} onClose={() => setShowGifDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a1a1a', color: 'white' }}>
          Upload GIF
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a1a' }}>
          <input
            accept="image/gif"
            style={{ display: 'none' }}
            id="upload-gif"
            type="file"
            onChange={(e) => setGifFile(e.target.files?.[0] || null)}
          />
          <label htmlFor="upload-gif">
            <Button
              component="span"
              variant="contained"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ mt: 2, bgcolor: '#2a2a2a', color: 'white' }}
            >
              Select GIF File
            </Button>
          </label>
          {gifFile && (
            <Typography variant="body2" sx={{ color: 'white', mt: 2 }}>
              Selected: {gifFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a1a1a' }}>
          <Button onClick={() => setShowGifDialog(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button onClick={handleGifSubmit} variant="contained" disabled={!gifFile} sx={{ bgcolor: '#ff6b6b', '&:hover': { bgcolor: '#ff5252' } }}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Playlist Dialog */}
      <Dialog open={showPlaylistDialog} onClose={() => setShowPlaylistDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a1a1a', color: 'white' }}>
          Create Playlist
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a1a' }}>
          <TextField
            fullWidth
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name"
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a1a1a' }}>
          <Button onClick={() => setShowPlaylistDialog(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button onClick={handlePlaylistSubmit} variant="contained" sx={{ bgcolor: '#ff6b6b', '&:hover': { bgcolor: '#ff5252' } }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* GIF Detail Dialog */}
      <Dialog open={showGifDetailDialog} onClose={() => setShowGifDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1a1a1a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">GIF Details</Typography>
          <IconButton onClick={() => setShowGifDetailDialog(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1a1a1a' }}>
          {selectedGif && (
            <Box>
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                {selectedGif.gif_file_base64 && (
                  <Box
                    component="img"
                    src={selectedGif.gif_file_base64}
                    alt="GIF"
                    sx={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 2 }}
                  />
                )}
              </Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Models</InputLabel>
                <Select
                  multiple
                  value={selectedModelIds}
                  onChange={(e) => setSelectedModelIds(Array.isArray(e.target.value) ? e.target.value : [])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const model = allModels.find(m => m.id === value);
                        return model ? <Chip key={value} label={model.name} size="small" /> : null;
                      })}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a1a1a',
                        color: 'white',
                      }
                    }
                  }}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  {allModels.map((model) => (
                    <MenuItem key={model.id} value={model.id} sx={{ color: 'white' }}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={gifDetailDescription}
                onChange={(e) => setGifDetailDescription(e.target.value)}
                label="Description"
                placeholder="Add a description for this GIF..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a1a1a' }}>
          <Button onClick={() => setShowGifDetailDialog(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              // TODO: Save GIF details with models and description
              toast.success('GIF details saved!');
              setShowGifDetailDialog(false);
            }} 
            variant="contained" 
            sx={{ bgcolor: '#ff6b6b', '&:hover': { bgcolor: '#ff5252' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialogOpen} onClose={() => setEditProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Username"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              fullWidth
              disabled
              helperText="Username cannot be changed"
            />
            <TextField
              label="Email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              fullWidth
              disabled
              helperText="Email cannot be changed"
            />
            <TextField
              label="Bio"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProfileDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditProfileSave} variant="contained" sx={{ bgcolor: '#ff6b6b', '&:hover': { bgcolor: '#ff5252' } }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;