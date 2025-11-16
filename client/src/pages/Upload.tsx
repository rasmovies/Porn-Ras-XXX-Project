import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { CloudUpload, VideoFile, PlayArrow, Delete, Edit } from '@mui/icons-material';
import { motion } from 'motion/react';
import { videoService, categoryService, modelService, channelService, subscriptionService, channelSubscriptionService, notificationService } from '../services/database';
import { blueskyApi } from '../services/emailApi';
import { Video, Category, Model, Channel } from '../lib/supabase';
import VideoCard from '../components/Video/VideoCard';
import { useNavigate } from 'react-router-dom';
import {
  validateVideoFile,
  validateImageFile,
  validateTitle,
  validateDescription,
  validateStreamtapeUrl,
  sanitizeInput,
} from '../utils/validation';
import { toast } from 'react-hot-toast';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [streamtapeUrl, setStreamtapeUrl] = useState<string>('');
  const [embedMode, setEmbedMode] = useState<'file' | 'streamtape'>('file');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [videoCategory, setVideoCategory] = useState<string>('');
  const [videoTags, setVideoTags] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<string>('');
  const [streamtapeThumbnail, setStreamtapeThumbnail] = useState<string | null>(null);
  const [streamtapeThumbnailUrl, setStreamtapeThumbnailUrl] = useState<string>('');
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [streamtapeVideos, setStreamtapeVideos] = useState<Video[]>([]);
  const [loadingStreamtapeVideos, setLoadingStreamtapeVideos] = useState(false);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loadingAllVideos, setLoadingAllVideos] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editModelIds, setEditModelIds] = useState<string[]>([]);
  const [editChannelIds, setEditChannelIds] = useState<string[]>([]);

  // Load categories, models, and all videos from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoadingAllVideos(true);
      try {
        const [categoriesData, modelsData, channelsData, videosData] = await Promise.all([
          categoryService.getAll(),
          modelService.getAll(),
          channelService.getAll(),
          videoService.getAll()
        ]);
        setCustomCategories(categoriesData);
        setModels(modelsData);
        setChannels(channelsData);
        setAllVideos(videosData);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to localStorage if Supabase fails
        const savedCategories = localStorage.getItem('adminCategories');
        const savedModels = localStorage.getItem('adminModels');
        
        if (savedCategories) {
          setCustomCategories(JSON.parse(savedCategories));
        }
        if (savedModels) {
          const modelsData = JSON.parse(savedModels);
          // Keep full model objects, not just names
          setModels(modelsData);
        }
      } finally {
        setLoadingAllVideos(false);
      }
    };

    loadData();
  }, []);

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  const handleDeleteClick = (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    try {
      await videoService.delete(videoToDelete);
      toast.success('Video başarıyla silindi');
      // Reload videos list
      const videos = await videoService.getAll();
      setAllVideos(videos);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete video:', error);
      toast.error('Video silinemedi');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setVideoToDelete(null);
  };

  const sendVideoNotifications = async (videoData: any, videoTitle: string) => {
    try {
      // Get subscriptions for the model if it exists
      if (videoData.model_id) {
        const modelSubscribers = await subscriptionService.getByModel(videoData.model_id);
        for (const sub of modelSubscribers) {
          const modelName = models.find(m => m.id === videoData.model_id)?.name || 'Unknown Model';
          await notificationService.create({
            user_id: sub.user_name,
            type: 'video',
            title: 'New Video Upload',
            message: `${modelName} uploaded a new video.`
          });
        }
      }

      // Get subscriptions for the channel if it exists
      if (videoData.channel_id) {
        const channelSubscribers = await channelSubscriptionService.getByChannel(videoData.channel_id);
        for (const sub of channelSubscribers) {
          const channelName = channels.find(c => c.id === videoData.channel_id)?.name || 'Unknown Channel';
          await notificationService.create({
            user_id: sub.user_name,
            type: 'video',
            title: 'New Video Upload',
            message: `${channelName} uploaded a new video.`
          });
        }
      }
      
    } catch (error) {
      console.error('Failed to send video notifications:', error);
      // Don't show error to user as this is a background task
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate video file
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Geçersiz video dosyası');
        setValidationErrors((prev) => ({ ...prev, videoFile: validation.error || '' }));
        event.target.value = ''; // Reset input
        return;
      }

      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.videoFile;
        return newErrors;
      });

      setSelectedFile(file);
      setUploadComplete(false);
      
      // Create video preview URL
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
      
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setUploadComplete(true);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedFile(null);
    setVideoPreview(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setIsUploading(false);
  };

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Geçersiz resim dosyası');
        setValidationErrors((prev) => ({ ...prev, thumbnail: validation.error || '' }));
        event.target.value = ''; // Reset input
        return;
      }

      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.thumbnail;
        return newErrors;
      });

      setThumbnailFile(file);
      
      // Create thumbnail preview URL
      const thumbnailUrl = URL.createObjectURL(file);
      setThumbnailPreview(thumbnailUrl);
    }
  };

  const handleRemoveThumbnail = () => {
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleStreamtapeThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Geçersiz resim dosyası');
        setValidationErrors((prev) => ({ ...prev, streamtapeThumbnail: validation.error || '' }));
        event.target.value = ''; // Reset input
        return;
      }

      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.streamtapeThumbnail;
        return newErrors;
      });

      setStreamtapeThumbnailUrl(''); // Clear URL when file is selected
      const reader = new FileReader();
      reader.onload = (e) => {
        setStreamtapeThumbnail(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStreamtapeThumbnailUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setStreamtapeThumbnailUrl(url);
    if (url.trim()) {
      setStreamtapeThumbnail(url.trim());
    } else {
      setStreamtapeThumbnail(null);
    }
  };

  const handleRemoveStreamtapeThumbnail = () => {
    setStreamtapeThumbnail(null);
    setStreamtapeThumbnailUrl('');
  };


  const handleStreamtapeUrlChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setStreamtapeUrl(url);
    
    if (url && url.includes('streamtape.com')) {
      setUploadComplete(true);
      
      // Load videos with this streamtape URL
      setLoadingStreamtapeVideos(true);
      try {
        const videos = await videoService.getByStreamtapeUrl(url);
        setStreamtapeVideos(videos);
      } catch (error) {
        console.error('Failed to load streamtape videos:', error);
        setStreamtapeVideos([]);
      } finally {
        setLoadingStreamtapeVideos(false);
      }
    } else {
      setUploadComplete(false);
      setStreamtapeVideos([]);
    }
  };

  const getStreamtapeEmbedUrl = (url: string) => {
    if (url.includes('/e/')) {
      return url;
    } else if (url.includes('streamtape.com/v/')) {
      return url.replace('/v/', '/e/');
    } else if (url.includes('streamtape.com')) {
      return url + '/e/';
    }
    return url;
  };

  const handlePublishVideo = async () => {
    // Clear previous errors
    setValidationErrors({});

    // Validate title
    const titleValidation = validateTitle(videoTitle);
    if (!titleValidation.valid) {
      toast.error(titleValidation.error || 'Başlık doğrulaması başarısız');
      setValidationErrors((prev) => ({ ...prev, title: titleValidation.error || '' }));
      return;
    }

    // Validate description
    const descValidation = validateDescription(videoDescription);
    if (!descValidation.valid) {
      toast.error(descValidation.error || 'Açıklama doğrulaması başarısız');
      setValidationErrors((prev) => ({ ...prev, description: descValidation.error || '' }));
      return;
    }

    // Validate based on embed mode
    if (embedMode === 'streamtape') {
      const urlValidation = validateStreamtapeUrl(streamtapeUrl);
      if (!urlValidation.valid) {
        toast.error(urlValidation.error || 'Streamtape URL doğrulaması başarısız');
        setValidationErrors((prev) => ({ ...prev, streamtapeUrl: urlValidation.error || '' }));
        return;
      }
    } else {
      if (!selectedFile) {
        toast.error('Lütfen bir video dosyası seçin');
        setValidationErrors((prev) => ({ ...prev, videoFile: 'Video dosyası gereklidir' }));
        return;
      }

      // Re-validate file in case it changed
      const fileValidation = validateVideoFile(selectedFile);
      if (!fileValidation.valid) {
        toast.error(fileValidation.error || 'Video dosyası doğrulaması başarısız');
        setValidationErrors((prev) => ({ ...prev, videoFile: fileValidation.error || '' }));
        return;
      }
    }

            setIsPublishing(true);
  
      try {
        // Sanitize inputs
        const sanitizedTitle = sanitizeInput(videoTitle);
        const sanitizedDescription = sanitizeInput(videoDescription);
  
        const videoSlug = sanitizedTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();

        // Use URL if available, otherwise use file preview
        const thumbnailToUse = embedMode === 'streamtape' 
          ? (streamtapeThumbnailUrl.trim() || streamtapeThumbnail || 'https://via.placeholder.com/400x225/ff6b6b/ffffff?text=Video+Thumbnail')
          : (thumbnailPreview || 'https://via.placeholder.com/400x225/ff6b6b/ffffff?text=Video+Thumbnail');
        
        // Create video data for Supabase
        const videoData = {
          title: sanitizedTitle,
          description: sanitizedDescription,
          thumbnail: thumbnailToUse,
          streamtape_url: embedMode === 'streamtape' ? getStreamtapeEmbedUrl(streamtapeUrl) : null,
          duration: videoDuration || '0:00',
          category_id: selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : null,
          model_id: selectedModelIds.length > 0 ? selectedModelIds[0] : null,
          channel_id: selectedChannelIds.length > 0 ? selectedChannelIds[0] : null,
          slug: videoSlug
        };

      // Save to Supabase
      const savedVideo = await videoService.create(videoData);

      // Send notifications to subscribers (non-blocking) BEFORE resetting form
      sendVideoNotifications(videoData, sanitizedTitle).catch(err => {
        console.error('Failed to send notifications:', err);
      });

      // Share to Bluesky (non-blocking)
      console.log('📤 Bluesky paylaşımı başlatılıyor...', {
        title: sanitizedTitle,
        description: sanitizedDescription,
        thumbnail: thumbnailToUse,
        slug: videoSlug,
      });
      
      blueskyApi.shareVideo({
        title: sanitizedTitle,
        description: sanitizedDescription,
        thumbnail: thumbnailToUse,
        slug: videoSlug,
      })
      .then(result => {
        console.log('✅ Bluesky paylaşımı başarılı:', result);
      })
      .catch(err => {
        console.error('❌ Failed to share to Bluesky:', err);
        console.error('Bluesky error details:', {
          message: err?.message,
          stack: err?.stack,
        });
        // Don't show error to user as this is a background task
      });

      setIsPublishing(false);
      
      // Reset form after notifications
      setVideoTitle('');
      setVideoDescription('');
      setVideoCategory('');
      setVideoTags('');
      setVideoDuration('');
              setStreamtapeUrl('');
        setSelectedFile(null);
        setVideoPreview(null);
        setUploadComplete(false);
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setStreamtapeThumbnail(null);
        setStreamtapeThumbnailUrl('');
        setSelectedCategoryIds([]);
        setSelectedModelIds([]);
        setSelectedChannelIds([]);

      // Show alert after form reset
      setTimeout(() => {
        alert(`Video published successfully to database! You can view it at: http://localhost:3000/video/${videoSlug}`);
      }, 100);
    } catch (error: any) {
      console.error('Failed to publish video:', error);
      const errorMessage = error?.message || 'Bilinmeyen bir hata oluştu';
      toast.error(`Video yüklenemedi: ${errorMessage}`);
      setIsPublishing(false);
    }
  };

  const handleEditClick = (video: Video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || '');
    setEditThumbnailUrl(video.thumbnail || '');
    setEditCategoryIds(video.category_id ? [video.category_id] : []);
    setEditModelIds(video.model_id ? [video.model_id] : []);
    setEditChannelIds(video.channel_id ? [video.channel_id] : []);
    setEditDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingVideo(null);
    setEditTitle('');
    setEditDescription('');
    setEditThumbnailUrl('');
    setEditCategoryIds([]);
    setEditModelIds([]);
    setEditChannelIds([]);
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;

    try {
      const updatedVideo = await videoService.update(editingVideo.id, {
        title: sanitizeInput(editTitle),
        description: sanitizeInput(editDescription),
        thumbnail: editThumbnailUrl || 'https://via.placeholder.com/400x225/ff6b6b/ffffff?text=Video',
        category_id: editCategoryIds[0] || null,
        model_id: editModelIds[0] || null,
        channel_id: editChannelIds[0] || null,
      });

      // Update local state
      setAllVideos(allVideos.map(v => v.id === editingVideo.id ? updatedVideo : v));
      
      toast.success('Video başarıyla güncellendi');
      setEditDialogOpen(false);
      setEditingVideo(null);
      setEditTitle('');
      setEditDescription('');
      setEditThumbnailUrl('');
      setEditCategoryIds([]);
      setEditModelIds([]);
      setEditChannelIds([]);
    } catch (error: any) {
      console.error('Failed to update video:', error);
      toast.error('Video güncellenemedi');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
          Upload Video
        </Typography>
        
        {/* Upload Mode Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Upload Method
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant={embedMode === 'file' ? 'contained' : 'outlined'}
              onClick={() => setEmbedMode('file')}
              startIcon={<CloudUpload />}
            >
              Upload File
            </Button>
            <Button
              variant={embedMode === 'streamtape' ? 'contained' : 'outlined'}
              onClick={() => setEmbedMode('streamtape')}
              startIcon={<VideoFile />}
            >
              Streamtape Embed
            </Button>
          </Box>
        </Box>
      </motion.div>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            {embedMode === 'file' ? 'Video File' : 'Streamtape URL'}
          </Typography>
          
          {embedMode === 'file' ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Box
                sx={{
                  border: selectedFile ? '2px solid #4caf50' : '2px dashed #ccc',
                  borderRadius: 2,
                  p: { xs: 2, md: 4 },
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                {selectedFile ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PlayArrow sx={{ fontSize: 48, mb: 2, color: 'success.main' }} />
                    <Typography variant="h6" gutterBottom color="success.main">
                      Video Selected: {selectedFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Click to change video
                    </Typography>
                  </motion.div>
                ) : (
                  <>
                    <CloudUpload sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
                    <Typography variant="h6" gutterBottom>
                      Drop your video here or click to browse
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Supports MP4, AVI, MOV up to 2GB
                    </Typography>
                  </>
                )}
                
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="video-upload"
                />
                <label htmlFor="video-upload">
                  <Button 
                    variant={selectedFile ? "outlined" : "contained"} 
                    component="span" 
                    startIcon={selectedFile ? <VideoFile /> : <VideoFile />}
                  >
                    {selectedFile ? 'Change Video' : 'Choose Video'}
                  </Button>
                </label>
              </Box>
            </motion.div>
          ) : (
            <Box>
              <TextField
                fullWidth
                label="Streamtape Video URL"
                placeholder="https://streamtape.com/v/your-video-id or https://streamtape.com/e/your-video-id"
                value={streamtapeUrl}
                onChange={handleStreamtapeUrlChange}
                variant="outlined"
                helperText="Enter a valid Streamtape video URL"
                sx={{ mb: 2 }}
              />
              {streamtapeUrl && streamtapeUrl.includes('streamtape.com') && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Valid Streamtape URL detected!
                </Alert>
              )}

              {/* Loading state */}
              {loadingStreamtapeVideos && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="info">
                    Searching for existing videos with this Streamtape URL...
                  </Alert>
                </Box>
              )}

              {/* Existing videos list */}
              {!loadingStreamtapeVideos && streamtapeVideos.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                    Existing Videos ({streamtapeVideos.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {streamtapeVideos.map((video) => (
                      <Card
                        key={video.id}
                        sx={{
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            {/* Thumbnail */}
                            <Box
                              sx={{
                                width: 160,
                                height: 90,
                                flexShrink: 0,
                                borderRadius: 1,
                                overflow: 'hidden',
                                bgcolor: 'action.hover',
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
                                  <VideoFile sx={{ fontSize: 40, color: 'text.secondary' }} />
                                </Box>
                              )}
                            </Box>

                            {/* Video details */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" sx={{ mb: 1 }} noWrap>
                                {video.title}
                              </Typography>
                              {video.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    mb: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {video.description}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  👁️ {video.views} views
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  👍 {video.likes} likes
                                </Typography>
                                {video.duration && (
                                  <Typography variant="caption" color="text.secondary">
                                    ⏱️ {video.duration}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}

              {!loadingStreamtapeVideos && streamtapeUrl && streamtapeUrl.includes('streamtape.com') && streamtapeVideos.length === 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No existing videos found with this Streamtape URL. This will be a new video.
                </Alert>
              )}

              {/* Streamtape Thumbnail Upload */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Video Thumbnail
                </Typography>
                <Box
                  sx={{
                    border: streamtapeThumbnail ? '2px solid #4caf50' : '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  {streamtapeThumbnail ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={streamtapeThumbnail}
                        alt="Thumbnail preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '150px',
                          borderRadius: '8px',
                          marginBottom: '16px',
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Delete />}
                          onClick={handleRemoveStreamtapeThumbnail}
                          size="small"
                        >
                          Remove
                        </Button>
                      </Box>
                    </motion.div>
                                      ) : (
                      <Box>
                        <CloudUpload sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
                        <Typography variant="h6" gutterBottom color="text.secondary">
                          Upload Thumbnail
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Choose a thumbnail image for your video or enter a URL
                        </Typography>
                        <TextField
                          fullWidth
                          label="Thumbnail URL (Optional)"
                          placeholder="Enter thumbnail URL"
                          value={streamtapeThumbnailUrl}
                          onChange={handleStreamtapeThumbnailUrlChange}
                          variant="outlined"
                          size="small"
                          sx={{ mb: 2 }}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStreamtapeThumbnailUpload}
                          style={{ display: 'none' }}
                          id="streamtape-thumbnail-upload"
                        />
                        <label htmlFor="streamtape-thumbnail-upload">
                          <Button 
                            variant="contained" 
                            component="span" 
                            startIcon={<CloudUpload />}
                          >
                            Choose Thumbnail
                          </Button>
                        </label>
                      </Box>
                    )}
                </Box>
              </Box>
            </Box>
          )}

          {isUploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {uploadComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                {embedMode === 'file' ? 'Video uploaded successfully!' : 'Streamtape URL added successfully!'}
              </Alert>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Video Preview
                </Typography>
                <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                  {embedMode === 'file' ? (
                    <video
                      src={videoPreview || ''}
                      controls
                      style={{
                        width: '100%',
                        height: '400px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        backgroundColor: '#000'
                      }}
                    />
                  ) : (
                    <iframe
                      src={getStreamtapeEmbedUrl(streamtapeUrl)}
                      width="100%"
                      height="400"
                      allowFullScreen
                      allowTransparency
                      allow="autoplay"
                      scrolling="no"
                      frameBorder="0"
                      style={{
                        borderRadius: '8px',
                        backgroundColor: '#000'
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: 1,
                    }}
                  >
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={handleRemoveVideo}
                      sx={{ color: 'white' }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
                
                {embedMode === 'file' && selectedFile && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>File:</strong> {selectedFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Type:</strong> {selectedFile.type}
                    </Typography>
                  </Box>
                )}
                
                {embedMode === 'streamtape' && streamtapeUrl && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Streamtape URL:</strong> {streamtapeUrl}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Embed URL:</strong> {getStreamtapeEmbedUrl(streamtapeUrl)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Status:</strong> Ready for embedding
                    </Typography>
                  </Box>
                )}
              </Box>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Thumbnail Upload */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Video Thumbnail (Optional)
          </Typography>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Box
              sx={{
                border: thumbnailFile ? '2px solid #4caf50' : '2px dashed #ccc',
                borderRadius: 2,
                p: { xs: 2, md: 4 },
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {thumbnailFile ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box sx={{ mb: 2 }}>
                    <img
                      src={thumbnailPreview || ''}
                      alt="Thumbnail preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '120px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                  <Typography variant="h6" gutterBottom color="success.main">
                    Thumbnail Selected: {thumbnailFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click to change thumbnail
                  </Typography>
                </motion.div>
              ) : (
                <>
                  <CloudUpload sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
                  <Typography variant="h6" gutterBottom>
                    Drop your thumbnail here or click to browse
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Supports JPG, PNG, GIF up to 5MB
                  </Typography>
                </>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                style={{ display: 'none' }}
                id="thumbnail-upload"
              />
              <label htmlFor="thumbnail-upload">
                <Button 
                  variant={thumbnailFile ? "outlined" : "contained"} 
                  component="span" 
                  startIcon={<CloudUpload />}
                >
                  {thumbnailFile ? 'Change Thumbnail' : 'Choose Thumbnail'}
                </Button>
              </label>
              
              {thumbnailFile && (
                <Button
                  variant="text"
                  color="error"
                  onClick={handleRemoveThumbnail}
                  sx={{ ml: 2 }}
                >
                  Remove
                </Button>
              )}
            </Box>
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Video Details
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Title"
              placeholder="Enter video title..."
              variant="outlined"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              placeholder="Describe your video..."
              multiline
              rows={4}
              variant="outlined"
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
            />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Categories</InputLabel>
                    <Select 
                      label="Categories"
                      multiple
                      value={selectedCategoryIds}
                      onChange={(e) => setSelectedCategoryIds(Array.isArray(e.target.value) ? e.target.value : [])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const category = customCategories.find(c => c.id === value);
                            return category ? (
                              <Chip key={value} label={category.name} size="small" />
                            ) : null;
                          })}
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 400,
                            '& .MuiMenuItem-root': {
                              minHeight: 'auto',
                              padding: '8px 16px',
                            },
                          },
                        },
                        anchorOrigin: {
                          vertical: 'bottom',
                          horizontal: 'left',
                        },
                        transformOrigin: {
                          vertical: 'top',
                          horizontal: 'left',
                        },
                      }}
                    >
                      {customCategories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Models</InputLabel>
                    <Select 
                      label="Models"
                      multiple
                      value={selectedModelIds}
                      onChange={(e) => setSelectedModelIds(Array.isArray(e.target.value) ? e.target.value : [])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const model = models.find(m => m.id === value);
                            return model ? (
                              <Chip key={value} label={model.name} size="small" />
                            ) : null;
                          })}
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 400,
                            '& .MuiMenuItem-root': {
                              minHeight: 'auto',
                              padding: '8px 16px',
                            },
                          },
                        },
                        anchorOrigin: {
                          vertical: 'bottom',
                          horizontal: 'left',
                        },
                        transformOrigin: {
                          vertical: 'top',
                          horizontal: 'left',
                        },
                      }}
                    >
                      {models.map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                          {model.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Channels</InputLabel>
                    <Select 
                      label="Channels"
                      multiple
                      value={selectedChannelIds}
                      onChange={(e) => setSelectedChannelIds(Array.isArray(e.target.value) ? e.target.value : [])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const channel = channels.find(c => c.id === value);
                            return channel ? (
                              <Chip key={value} label={channel.name} size="small" />
                            ) : null;
                          })}
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 400,
                            '& .MuiMenuItem-root': {
                              minHeight: 'auto',
                              padding: '8px 16px',
                            },
                          },
                        },
                        anchorOrigin: {
                          vertical: 'bottom',
                          horizontal: 'left',
                        },
                        transformOrigin: {
                          vertical: 'top',
                          horizontal: 'left',
                        },
                      }}
                    >
                      {channels.map((channel) => (
                        <MenuItem key={channel.id} value={channel.id}>
                          {channel.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TextField
                  fullWidth
                  label="Video Duration"
                  placeholder="e.g., 5:30, 12:45, 1:23:15"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                  variant="outlined"
                  helperText="Format: MM:SS or HH:MM:SS"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Age Rating</InputLabel>
                    <Select label="Age Rating" defaultValue="18+">
                      <MenuItem value="18+">18+</MenuItem>
                      <MenuItem value="21+">21+</MenuItem>
                    </Select>
                  </FormControl>
                </Box>


            <TextField
              fullWidth
              label="Tags"
              placeholder="Enter tags separated by commas..."
              variant="outlined"
              helperText="Tags help people discover your video"
              value={videoTags}
              onChange={(e) => setVideoTags(e.target.value)}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="large">
                Save Draft
              </Button>
              <Button 
                variant="contained" 
                size="large"
                onClick={handlePublishVideo}
                disabled={isPublishing || !videoTitle.trim()}
              >
                {isPublishing ? 'Publishing...' : 'Publish Video'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* All Videos Section */}
      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            All Uploaded Videos ({allVideos.length})
          </Typography>

          {loadingAllVideos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>Loading videos...</Typography>
            </Box>
          ) : allVideos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <VideoFile sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No videos uploaded yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload your first video to get started
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(3, 1fr)', 
                lg: 'repeat(4, 1fr)' 
              }, 
              gap: 3 
            }}>
              {allVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <VideoCard 
                      video={{
                        ...video,
                        thumbnail: video.thumbnail || 'https://via.placeholder.com/400x225/ff6b6b/ffffff?text=Video',
                        views: video.views || 0,
                        duration: video.duration || '0:00',
                        category: (video as any).category || 'Uncategorized',
                        uploadDate: video.created_at || new Date().toISOString()
                      }} 
                      onClick={() => handleVideoClick(video.slug || video.id)}
                    />
                                         <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                       <IconButton
                         onClick={(e) => {
                           e.stopPropagation();
                           handleEditClick(video);
                         }}
                         sx={{
                           bgcolor: 'rgba(0, 0, 0, 0.7)',
                           color: 'white',
                           '&:hover': {
                             bgcolor: 'rgba(0, 0, 0, 0.9)',
                           }
                         }}
                       >
                         <Edit />
                       </IconButton>
                       <IconButton
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDeleteClick(video.id);
                         }}
                         sx={{
                           bgcolor: 'rgba(0, 0, 0, 0.7)',
                           color: '#ff6b6b',
                           '&:hover': {
                             bgcolor: 'rgba(255, 107, 107, 0.9)',
                             color: 'white',
                           }
                         }}
                       >
                         <Delete />
                       </IconButton>
                     </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Video Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu videoyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            İptal
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit Video</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Video Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              fullWidth
              multiline
              rows={4}
            />
            <TextField
              label="Thumbnail URL"
              value={editThumbnailUrl}
              onChange={(e) => setEditThumbnailUrl(e.target.value)}
              fullWidth
              placeholder="Enter thumbnail image URL"
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editCategoryIds[0] || ''}
                onChange={(e) => setEditCategoryIds(e.target.value ? [e.target.value] : [])}
              >
                <MenuItem value="">None</MenuItem>
                {customCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={editModelIds[0] || ''}
                onChange={(e) => setEditModelIds(e.target.value ? [e.target.value] : [])}
              >
                <MenuItem value="">None</MenuItem>
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Channel</InputLabel>
              <Select
                value={editChannelIds[0] || ''}
                onChange={(e) => setEditChannelIds(e.target.value ? [e.target.value] : [])}
              >
                <MenuItem value="">None</MenuItem>
                {channels.map((channel) => (
                  <MenuItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editTitle.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Upload;
