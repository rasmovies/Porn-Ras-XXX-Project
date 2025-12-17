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
import { CloudUpload, VideoFile, PlayArrow, Delete, Edit, Add } from '@mui/icons-material';
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
  const [embedMode, setEmbedMode] = useState<'file' | 'streamtape'>('streamtape'); // Only Streamtape Embed mode
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
  const [uploadedStreamtapeUrl, setUploadedStreamtapeUrl] = useState<string>('');
  
  // Add Model/Category states
  const [addModelDialogOpen, setAddModelDialogOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelImageUrl, setNewModelImageUrl] = useState('');
  const [newModelIsTrans, setNewModelIsTrans] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryThumbnailUrl, setNewCategoryThumbnailUrl] = useState('');
  const [addChannelDialogOpen, setAddChannelDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelThumbnailUrl, setNewChannelThumbnailUrl] = useState('');
  const [videoTagsArray, setVideoTagsArray] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<string[]>([]);
  
  // Bluesky preview helper function
  const generateBlueskyPreview = (title: string, description: string, thumbnail: string | null, modelIds: string[], categoryIds: string[], slug?: string) => {
    const baseUrl = window.location.origin;
    const videoSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const videoUrl = `${baseUrl}/video/${videoSlug}`;
    
    // Get model and category names
    const modelName = modelIds.length > 0 ? models.find(m => m.id === modelIds[0])?.name : null;
    const categoryName = categoryIds.length > 0 ? customCategories.find(c => c.id === categoryIds[0])?.name : null;
    
    // Create hashtags
    const hashtags = [];
    if (modelName) {
      hashtags.push(`#${modelName.replace(/\s+/g, '').toLowerCase()}`);
    }
    if (categoryName) {
      hashtags.push(`#${categoryName.replace(/\s+/g, '').toLowerCase()}`);
    }
    
    // Truncate description
    const maxDescriptionLength = 120;
    const truncatedDescription = description 
      ? description.substring(0, maxDescriptionLength) + (description.length > maxDescriptionLength ? '...' : '')
      : '';
    
    // Build post text
    let postText = `🎬 Yeni Video: ${title}`;
    if (truncatedDescription) {
      postText += `\n\n${truncatedDescription}`;
    }
    if (hashtags.length > 0) {
      postText += `\n\n${hashtags.join(' ')}`;
    }
    postText += `\n\n🔗 ${videoUrl}`;
    
    return {
      text: postText,
      thumbnail: thumbnail || null,
      videoUrl
    };
  };

  // Upload Queue System (FileZilla-like)
  interface UploadItem {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'completed' | 'failed' | 'retrying';
    progress: number;
    streamtapeUrl?: string;
    error?: string;
    retryCount: number;
    speed?: number; // MB/s
    uploadedMB?: number;
    totalMB?: number;
  }

  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [maxConcurrentUploads] = useState(3); // FileZilla-like: concurrent uploads
  const [maxRetries] = useState(3); // Max retry attempts

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
        
        // Extract all tags from videos and save to localStorage
        const allTagsSet = new Set<string>();
        videosData.forEach((video: any) => {
          if (video.tags) {
            // Split tags by comma and trim
            const tags = video.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
            tags.forEach((tag: string) => allTagsSet.add(tag.toLowerCase()));
          }
        });
        
        // Get existing saved tags from localStorage
        const existingTags = JSON.parse(localStorage.getItem('savedVideoTags') || '[]');
        existingTags.forEach((tag: string) => allTagsSet.add(tag.toLowerCase()));
        
        // Convert to array and sort alphabetically
        const allTagsArray = Array.from(allTagsSet).sort();
        
        // Save to localStorage
        localStorage.setItem('savedVideoTags', JSON.stringify(allTagsArray));
        setSavedTags(allTagsArray);
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
        
        // Load saved tags from localStorage
        const savedTagsFromStorage = JSON.parse(localStorage.getItem('savedVideoTags') || '[]');
        setSavedTags(savedTagsFromStorage);
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
      toast.success('Video deleted successfully');
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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Support both single and multiple file selection
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const validation = validateVideoFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error || 'Geçersiz video dosyası'}`);
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length === 0) {
      event.target.value = '';
        return;
      }

    // Clear previous errors
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.videoFile;
        return newErrors;
      });

    // If single file, use old behavior for preview
    if (validFiles.length === 1) {
      setSelectedFile(validFiles[0]);
      setUploadComplete(false);
      setUploadedStreamtapeUrl('');
      const videoUrl = URL.createObjectURL(validFiles[0]);
      setVideoPreview(videoUrl);
    } else {
      // Multiple files: add to queue
      const newItems: UploadItem[] = validFiles.map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: 'pending',
        progress: 0,
        retryCount: 0
      }));

      setUploadQueue(prev => [...prev, ...newItems]);
      toast.success(`${validFiles.length} dosya yükleme kuyruğuna eklendi`);
          }

    event.target.value = '';
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

  // Add Model function
  const handleAddModel = async () => {
    if (newModelName.trim() && !models.some(m => m.name === newModelName.trim())) {
      try {
        const imageToUse = newModelImageUrl.trim() || null;
        const createdModel = await modelService.create({
          name: newModelName.trim(),
          image: imageToUse,
          is_trans: newModelIsTrans
        });
        
        // If is_trans is true, save model ID to localStorage
        if (newModelIsTrans && createdModel.id) {
          try {
            const transModels = JSON.parse(localStorage.getItem('transModels') || '[]');
            if (!transModels.includes(createdModel.id)) {
              transModels.push(createdModel.id);
              localStorage.setItem('transModels', JSON.stringify(transModels));
              console.log('✅ Saved trans model to localStorage:', createdModel.id, createdModel.name);
            }
          } catch (e) {
            console.error('Failed to save trans model to localStorage:', e);
          }
        }
        
        setModels([...models, createdModel]);
        setNewModelName('');
        setNewModelImageUrl('');
        setNewModelIsTrans(false);
        setAddModelDialogOpen(false);
        toast.success('Model added successfully!');
      } catch (error: any) {
        const errorCode = error?.code || 'unknown';
        const errorMessage = error?.message || 'Unknown error';
        
        console.error('❌ Model creation error:', error);
        console.error('   Error code:', errorCode);
        console.error('   Error message:', errorMessage);
        
        // Handle specific error codes
        if (errorCode === '23505') {
          // Unique constraint violation - model name already exists
          toast.error(`Model "${newModelName.trim()}" already exists! Please use a different name.`);
        } else {
          toast.error(`Failed to add model: ${errorMessage}`);
        }
      }
    } else if (models.some(m => m.name === newModelName.trim())) {
      toast.error('Model already exists!');
    }
  };

  // Add Category function
  const handleAddCategory = async () => {
    if (newCategoryName.trim() && !customCategories.some(cat => cat.name === newCategoryName.trim())) {
      try {
        const thumbnailToUse = newCategoryThumbnailUrl.trim() || null;
        const newCategoryData = await categoryService.create({
          name: newCategoryName.trim(),
          thumbnail: thumbnailToUse,
        });
        setCustomCategories([...customCategories, newCategoryData]);
        setNewCategoryName('');
        setNewCategoryThumbnailUrl('');
        setAddCategoryDialogOpen(false);
        toast.success('Category added successfully!');
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        toast.error(`Failed to add category: ${errorMessage}`);
      }
    } else if (customCategories.some(cat => cat.name === newCategoryName.trim())) {
      toast.error('Category already exists!');
    }
  };

  // Add Channel function
  const handleAddChannel = async () => {
    if (newChannelName.trim() && !channels.some(c => c.name === newChannelName.trim())) {
      try {
        const thumbnailToUse = newChannelThumbnailUrl.trim() || null;
        await channelService.create({
          name: newChannelName.trim(),
          description: newChannelDescription,
          thumbnail: thumbnailToUse,
          banner: null
        });
        const newChannelData: Channel = {
          id: Date.now().toString(),
          name: newChannelName.trim(),
          description: newChannelDescription,
          thumbnail: thumbnailToUse,
          banner: null,
          subscriber_count: 0,
          created_at: new Date().toISOString()
        };
        setChannels([...channels, newChannelData]);
        setNewChannelName('');
        setNewChannelDescription('');
        setNewChannelThumbnailUrl('');
        setAddChannelDialogOpen(false);
        toast.success('Channel added successfully!');
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        toast.error(`Failed to add channel: ${errorMessage}`);
      }
    } else if (channels.some(c => c.name === newChannelName.trim())) {
      toast.error('Channel already exists!');
    }
  };

  // Handle tags input - convert comma-separated to array
  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // If comma is pressed, add current text as tag
    if (value.endsWith(',')) {
      const tagToAdd = value.slice(0, -1).trim();
      if (tagToAdd && !videoTagsArray.includes(tagToAdd)) {
        setVideoTagsArray([...videoTagsArray, tagToAdd]);
        
        // Save tag to localStorage if not already saved
        const tagLower = tagToAdd.toLowerCase();
        if (!savedTags.includes(tagLower)) {
          const updatedTags = [...savedTags, tagLower].sort();
          localStorage.setItem('savedVideoTags', JSON.stringify(updatedTags));
          setSavedTags(updatedTags);
        }
      }
      setVideoTags('');
    } else {
      setVideoTags(value);
    }
  };

  // Handle tag deletion
  const handleDeleteTag = (tagToDelete: string) => {
    setVideoTagsArray(videoTagsArray.filter(tag => tag !== tagToDelete));
  };

  // Handle tag input key press (Enter to add tag)
  const handleTagsKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && videoTags.trim()) {
      event.preventDefault();
      const tagToAdd = videoTags.trim();
      if (!videoTagsArray.includes(tagToAdd)) {
        setVideoTagsArray([...videoTagsArray, tagToAdd]);
        
        // Save tag to localStorage if not already saved
        const tagLower = tagToAdd.toLowerCase();
        if (!savedTags.includes(tagLower)) {
          const updatedTags = [...savedTags, tagLower].sort();
          localStorage.setItem('savedVideoTags', JSON.stringify(updatedTags));
          setSavedTags(updatedTags);
        }
      }
      setVideoTags('');
    }
  };

  // Handle adding tag from saved tags
  const handleAddSavedTag = (tag: string) => {
    const tagToAdd = tag.trim();
    if (tagToAdd && !videoTagsArray.includes(tagToAdd)) {
      setVideoTagsArray([...videoTagsArray, tagToAdd]);
    }
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

  // Upload single file with retry mechanism (FileZilla-like)
  const uploadFileToStreamtape = async (
    file: File,
    uploadItemId: string,
    retryCount: number = 0
  ): Promise<string> => {
    const ST_KEYS = {
      method: 'streamtape_auth_method',
      login: 'streamtape_login',
      key: 'streamtape_key',
      cookies: 'streamtape_cookies'
    };

    const streamtapeAuthMethod = localStorage.getItem(ST_KEYS.method) || 'apikey';
    const streamtapeLogin = localStorage.getItem(ST_KEYS.login) || '';
    const streamtapeKey = localStorage.getItem(ST_KEYS.key) || '';
    const streamtapeCookies = localStorage.getItem(ST_KEYS.cookies) || '';

    if (!streamtapeLogin && !streamtapeKey && !streamtapeCookies) {
      throw new Error('Streamtape credentials bulunamadı. Lütfen Torrent Manager\'dan Streamtape ayarlarını yapın.');
    }

    // Update status to uploading/retrying
    setUploadQueue(prev => prev.map(item => 
      item.id === uploadItemId 
        ? { ...item, status: retryCount > 0 ? 'retrying' : 'uploading', error: undefined }
        : item
    ));

    try {
      // Get upload URL
      const urlResponse = await fetch('/api/upload/get-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamtapeLogin,
          streamtapeKey,
          streamtapeCookies,
          streamtapeAuthMethod
        })
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({ message: 'Upload URL alınamadı' }));
        throw new Error(errorData.message || 'Upload URL alınamadı');
      }

      const urlData = await urlResponse.json();
      if (!urlData.success || !urlData.uploadUrl) {
        throw new Error('Upload URL alınamadı');
      }

      const uploadUrl = urlData.uploadUrl;
      const formData = new FormData();
      formData.append('file', file);

      const uploadHeaders: HeadersInit = {};
      if (streamtapeAuthMethod === 'cookie' && streamtapeCookies) {
        const cleanCookies = streamtapeCookies
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\t/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        uploadHeaders['Cookie'] = cleanCookies;
      }

      // Upload with progress tracking
      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const startTime = Date.now();
        let lastLoaded = 0;

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded * 100) / e.total);
            const uploadedMB = e.loaded / (1024 * 1024);
            const totalMB = e.total / (1024 * 1024);
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = elapsed > 0 ? (e.loaded - lastLoaded) / elapsed / (1024 * 1024) : 0;
            lastLoaded = e.loaded;

            setUploadQueue(prev => prev.map(item => 
              item.id === uploadItemId 
                ? { 
                    ...item, 
                    progress: percent,
                    uploadedMB,
                    totalMB,
                    speed
                  }
                : item
            ));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseText = xhr.responseText;
              let result;
              try {
                result = JSON.parse(responseText);
              } catch (e) {
                result = { raw: responseText };
              }

              // Extract file ID (same logic as before)
              let fileId = null;
              if (result.result) {
                fileId = result.result.id || result.result.fileid || result.result.file_id;
                if (!fileId && result.result.url) {
                  const match = result.result.url.match(/[\/v|e|d]+\/([a-zA-Z0-9]+)/);
                  if (match) fileId = match[1];
                }
              }
              if (!fileId) {
                fileId = result.id || result.fileid || result.file_id;
              }
              if (!fileId && result.raw) {
                const match = result.raw.match(/streamtape\.com\/[ve]+\/([a-zA-Z0-9]+)/i);
                if (match) fileId = match[1];
              }

              if (fileId) {
                const embedUrl = `https://streamtape.com/e/${fileId}/`;
                setUploadQueue(prev => prev.map(item => 
                  item.id === uploadItemId 
                    ? { ...item, status: 'completed', streamtapeUrl: embedUrl, progress: 100 }
                    : item
                ));
                resolve(embedUrl);
              } else {
                throw new Error('File ID alınamadı');
              }
            } catch (parseError: any) {
              reject(new Error(`Response parse error: ${parseError.message}`));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('POST', uploadUrl);
        Object.entries(uploadHeaders).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        xhr.send(formData);
      });
    } catch (error: any) {
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying upload (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
        return uploadFileToStreamtape(file, uploadItemId, retryCount + 1);
      } else {
        setUploadQueue(prev => prev.map(item => 
          item.id === uploadItemId 
            ? { ...item, status: 'failed', error: error.message, retryCount: retryCount + 1 }
            : item
        ));
        throw error;
      }
    }
  };

  // Process upload queue (FileZilla-like concurrent uploads)
  const processUploadQueue = async () => {
    if (isProcessingQueue) return;
    setIsProcessingQueue(true);

    const processLoop = async () => {
      while (true) {
        // Get fresh state using functional update
        let shouldContinue = false;
        setUploadQueue(currentQueue => {
          const pendingItems = currentQueue.filter(item => item.status === 'pending');
          const uploadingItems = currentQueue.filter(item => 
            item.status === 'uploading' || item.status === 'retrying'
          );

          // Start new uploads if we have capacity
          const availableSlots = maxConcurrentUploads - uploadingItems.length;
          const itemsToStart = pendingItems.slice(0, availableSlots);

          if (itemsToStart.length === 0 && uploadingItems.length === 0) {
            // Queue is empty or all completed
            shouldContinue = false;
            return currentQueue;
          }

          shouldContinue = true;

          // Start uploads for available slots
          itemsToStart.forEach(item => {
            uploadFileToStreamtape(item.file, item.id, 0).catch(err => {
              console.error('Upload failed:', err);
            });
          });

          return currentQueue;
        });

        if (!shouldContinue) {
          setIsProcessingQueue(false);
          break;
        }

        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    processLoop();
  };

  // Auto-start queue processing when items are added
  useEffect(() => {
    if (uploadQueue.length > 0 && !isProcessingQueue) {
      processUploadQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadQueue.length, isProcessingQueue]);

  const handlePublishVideo = async () => {
    // Clear previous errors
    setValidationErrors({});

    // Validate title
    const titleValidation = validateTitle(videoTitle);
    if (!titleValidation.valid) {
      toast.error(titleValidation.error || 'Title validation failed');
      setValidationErrors((prev) => ({ ...prev, title: titleValidation.error || '' }));
      return;
    }

    // Validate description
    const descValidation = validateDescription(videoDescription);
    if (!descValidation.valid) {
      toast.error(descValidation.error || 'Description validation failed');
      setValidationErrors((prev) => ({ ...prev, description: descValidation.error || '' }));
      return;
    }

    // Validate based on embed mode
    if (embedMode === 'streamtape') {
      const urlValidation = validateStreamtapeUrl(streamtapeUrl);
      if (!urlValidation.valid) {
        toast.error(urlValidation.error || 'Streamtape URL validation failed');
        setValidationErrors((prev) => ({ ...prev, streamtapeUrl: urlValidation.error || '' }));
        return;
      }
    } else {
      if (!selectedFile) {
        toast.error('Please select a video file');
        setValidationErrors((prev) => ({ ...prev, videoFile: 'Video file is required' }));
        return;
      }

      // Re-validate file in case it changed
      const fileValidation = validateVideoFile(selectedFile);
      if (!fileValidation.valid) {
        toast.error(fileValidation.error || 'Video file validation failed');
        setValidationErrors((prev) => ({ ...prev, videoFile: fileValidation.error || '' }));
        return;
      }
    }

            setIsPublishing(true);
  
      try {
      // If file mode, upload file to Streamtape first
      let finalStreamtapeUrl = streamtapeUrl;
      
      if (false && embedMode === 'file' && selectedFile) {
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
          // Get Streamtape credentials from localStorage (same keys as torrent-manager)
          const ST_KEYS = {
            method: 'streamtape_auth_method',
            login: 'streamtape_login',
            key: 'streamtape_key',
            cookies: 'streamtape_cookies'
          };
          
          const streamtapeAuthMethod = localStorage.getItem(ST_KEYS.method) || 'apikey';
          const streamtapeLogin = localStorage.getItem(ST_KEYS.login) || '';
          const streamtapeKey = localStorage.getItem(ST_KEYS.key) || '';
          const streamtapeCookies = localStorage.getItem(ST_KEYS.cookies) || '';
          
          if (!streamtapeLogin && !streamtapeKey && !streamtapeCookies) {
            throw new Error('Streamtape credentials bulunamadı. Lütfen Torrent Manager\'dan Streamtape ayarlarını yapın.');
          }
          
          // Step 1: Get upload URL from our API (FileZilla-like approach)
          const urlResponse = await fetch('/api/upload/get-upload-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              streamtapeLogin,
              streamtapeKey,
              streamtapeCookies,
              streamtapeAuthMethod
            })
          });
          
          if (!urlResponse.ok) {
            const errorData = await urlResponse.json().catch(() => ({ message: 'Upload URL alınamadı' }));
            throw new Error(errorData.message || 'Upload URL alınamadı');
          }
          
          const urlData = await urlResponse.json();
          if (!urlData.success || !urlData.uploadUrl) {
            throw new Error('Upload URL alınamadı');
          }
          
          const uploadUrl = urlData.uploadUrl;
          console.log('✅ Upload URL alındı:', uploadUrl);
          
          // Step 2: Upload file directly to Streamtape from browser (FileZilla-like)
          // This is much more efficient - no base64 encoding, no server in between
          if (!selectedFile) {
            throw new Error('No file selected');
          }
          
          // TypeScript type narrowing: after null check, selectedFile is guaranteed to be non-null
          // Using non-null assertion since we've already checked for null above
          const fileToUpload: File = selectedFile!;
          
          const formData = new FormData();
          formData.append('file', fileToUpload);
          
          // Prepare headers with cookies if using cookie auth
          const uploadHeaders: Record<string, string> = {};
          if (streamtapeAuthMethod === 'cookie' && streamtapeCookies) {
            // Clean cookies (remove newlines, etc.)
            const cleanCookies = streamtapeCookies
              .replace(/\r\n/g, ' ')
              .replace(/\n/g, ' ')
              .replace(/\r/g, ' ')
              .replace(/\t/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            uploadHeaders['Cookie'] = cleanCookies;
          }
          
          // Upload directly to Streamtape with progress tracking
          const xhr = new XMLHttpRequest();
          
          // Track upload progress
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded * 100) / e.total);
              setUploadProgress(percent);
              console.log(`📊 Upload progress: ${percent}% (${(e.loaded / 1024 / 1024).toFixed(2)} MB / ${(e.total / 1024 / 1024).toFixed(2)} MB)`);
            }
          });
          
          // Wait for upload to complete
          await new Promise<void>((resolve, reject) => {
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const responseText = xhr.responseText;
                  console.log('📥 Streamtape response:', responseText);
                  
                  // Parse response (same logic as streamtape.js)
                  let result;
                  if (typeof responseText === 'string') {
                    try {
                      result = JSON.parse(responseText);
                    } catch (e) {
                      // Not JSON, might be HTML or other format
                      result = { raw: responseText };
                    }
                  } else {
                    result = responseText;
                  }
                  
                  // Extract file ID using same logic as streamtape.js
                  let fileId = null;
                  let fileUrl = null;
                  let embedUrl = null;
                  
                  // Try result object first
                  if (result.result) {
                    fileId = result.result.id || result.result.fileid || result.result.file_id || 
                             result.result.fid || result.result.vid || result.result.video_id;
                    fileUrl = result.result.url || result.result.file_url || result.result.download_url || 
                              result.result.link || result.result.video_url;
                    embedUrl = result.result.embed_url || result.result.embedUrl || result.result.embed || 
                               result.result.player_url || result.result.player;
                    
                    // Extract ID from URL if needed
                    if (!fileId && fileUrl) {
                      const urlMatch = fileUrl.match(/[\/v|e|d]+\/([a-zA-Z0-9]+)/);
                      if (urlMatch && urlMatch[1]) {
                        fileId = urlMatch[1];
                      }
                    }
                  }
                  
                  // Try root level fields
                  if (!fileId) {
                    fileId = result.id || result.fileid || result.file_id || result.fid || 
                             result.vid || result.video_id;
                    fileUrl = result.url || result.file_url || result.download_url || 
                              result.link || result.video_url;
                    embedUrl = result.embed_url || result.embedUrl || result.embed || 
                               result.player_url || result.player;
                  }
                  
                  // Try to extract from msg field
                  if (!fileId && result.msg && typeof result.msg === 'string') {
                    const urlMatch = result.msg.match(/https?:\/\/[^\s]+/);
                    if (urlMatch && urlMatch[0]) {
                      fileUrl = urlMatch[0];
                      const idMatch = fileUrl.match(/[\/v|e|d]+\/([a-zA-Z0-9]+)/);
                      if (idMatch && idMatch[1]) {
                        fileId = idMatch[1];
                      }
                    }
                  }
                  
                  // Try regex patterns on raw response if still no ID
                  if (!fileId && result.raw) {
                    const patterns = [
                      /fileid["\s:=]+([a-zA-Z0-9]+)/i,
                      /["']id["']:\s*["']([a-zA-Z0-9]+)["']/i,
                      /streamtape\.com\/[ve]+\/([a-zA-Z0-9]+)/i
                    ];
                    
                    for (const pattern of patterns) {
                      const match = result.raw.match(pattern);
                      if (match && match[1]) {
                        fileId = match[1];
                        break;
                      }
                    }
                  }
                  
                  // Construct URLs if we have fileId
                  if (fileId) {
                    if (!embedUrl) {
                      embedUrl = `https://streamtape.com/e/${fileId}/`;
                    }
                    finalStreamtapeUrl = embedUrl;
                    setUploadedStreamtapeUrl(finalStreamtapeUrl);
                    console.log('✅ File uploaded! Streamtape URL:', finalStreamtapeUrl);
                    toast.success('Video uploaded to Streamtape successfully!');
                    resolve();
                  } else {
                    console.error('❌ Could not extract file ID from response:', result);
                    reject(new Error('Upload tamamlandı ancak dosya ID alınamadı. Lütfen Streamtape hesabınızdan kontrol edin.'));
                  }
                } catch (parseError: any) {
                  console.error('❌ Response parse error:', parseError);
                  reject(new Error(`Response parse error: ${parseError.message}`));
                }
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
              }
            });
            
            xhr.addEventListener('error', () => {
              reject(new Error('Upload network error'));
            });
            
            xhr.addEventListener('abort', () => {
              reject(new Error('Upload aborted'));
            });
            
            // Start upload
            xhr.open('POST', uploadUrl);
            
            // Set headers
            Object.entries(uploadHeaders).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value);
            });
            
            xhr.send(formData);
          });
          
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          toast.error(`Dosya yüklenemedi: ${uploadError.message || 'Bilinmeyen hata'}`);
          setIsPublishing(false);
          setIsUploading(false);
          setUploadProgress(0);
          return;
        } finally {
          setIsUploading(false);
        }
      }

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
        
        // Combine tags array with current input
        const allTags = [...videoTagsArray];
        if (videoTags.trim()) {
          allTags.push(videoTags.trim());
        }
        const tagsString = allTags.length > 0 ? allTags.join(', ') : null;

        // Create video data for Supabase
        const videoData = {
          title: sanitizedTitle,
          description: sanitizedDescription,
          thumbnail: thumbnailToUse,
        streamtape_url: embedMode === 'streamtape' ? getStreamtapeEmbedUrl(streamtapeUrl) : (finalStreamtapeUrl ? getStreamtapeEmbedUrl(finalStreamtapeUrl) : null),
          duration: videoDuration || '0:00',
          tags: tagsString,
          category_id: selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : null,
          model_id: selectedModelIds.length > 0 ? selectedModelIds[0] : null,
          channel_id: selectedChannelIds.length > 0 ? selectedChannelIds[0] : null,
          slug: videoSlug
        };

      // Save to Supabase
      const savedVideo = await videoService.create(videoData);

      // Save all tags to localStorage
      allTags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (!savedTags.includes(tagLower)) {
          const updatedTags = [...savedTags, tagLower].sort();
          localStorage.setItem('savedVideoTags', JSON.stringify(updatedTags));
          setSavedTags(updatedTags);
        }
      });

      // Show success notification for Streamtape embed mode
      if (embedMode === 'streamtape') {
        toast.success('Video upload success', {
          position: 'bottom-right',
          duration: 3000,
        });
        
        // Show video URL notification after a short delay
        setTimeout(() => {
          const videoUrl = `${window.location.origin}/video/${videoSlug}`;
          toast.success(`Video URL: ${videoUrl}`, {
            position: 'bottom-right',
            duration: 5000,
          });
        }, 500);
      }

      // Send notifications to subscribers (non-blocking) BEFORE resetting form
      sendVideoNotifications(videoData, sanitizedTitle).catch(err => {
        console.error('Failed to send notifications:', err);
      });

      // Get model and category names for Bluesky hashtags
      let modelName = null;
      let categoryName = null;
      
      if (selectedModelIds.length > 0) {
        try {
          const model = await modelService.getById(selectedModelIds[0]);
          if (model) modelName = model.name;
        } catch (err) {
          console.warn('Failed to get model name:', err);
        }
      }
      
      if (selectedCategoryIds.length > 0) {
        try {
          const category = await categoryService.getById(selectedCategoryIds[0]);
          if (category) categoryName = category.name;
        } catch (err) {
          console.warn('Failed to get category name:', err);
        }
      }

      // Share to Bluesky (non-blocking)
      console.log('📤 Bluesky paylaşımı başlatılıyor...', {
        title: sanitizedTitle,
        description: sanitizedDescription,
        thumbnail: thumbnailToUse,
        slug: videoSlug,
        modelName,
        categoryName,
      });
      
      blueskyApi.shareVideo({
        title: sanitizedTitle,
        description: sanitizedDescription,
        thumbnail: thumbnailToUse,
        slug: videoSlug,
        modelName: modelName || undefined,
        categoryName: categoryName || undefined,
      })
      .then(result => {
        console.log('✅ Bluesky paylaşımı başarılı:', result);
        toast.success('✅ Video Bluesky\'de paylaşıldı!', {
          duration: 4000,
          icon: '📱',
        });
      })
      .catch(err => {
        console.error('❌ Failed to share to Bluesky:', err);
        console.error('Bluesky error details:', {
          message: err?.message,
          stack: err?.stack,
        });
        // Show warning toast (not error, as video was saved successfully)
        toast.error('⚠️ Video saved but Bluesky sharing failed. Please share manually.', {
          duration: 5000,
        });
      });

      setIsPublishing(false);
      
      // Reset form after notifications
      setVideoTitle('');
      setVideoDescription('');
      setVideoCategory('');
      setVideoTags('');
      setVideoTagsArray([]);
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
      
      toast.success('Video updated successfully');
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
          Upload Video
        </Typography>
        
        {/* Upload Queue (FileZilla-like) - Removed, only Streamtape Embed mode */}
        {uploadQueue.length > 0 && (
          <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  📤 Upload Queue ({uploadQueue.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      setUploadQueue([]);
                      toast.success('Upload queue temizlendi');
                    }}
                  >
                    Clear All
                  </Button>
                  {!isProcessingQueue && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => processUploadQueue()}
                    >
                      Start Queue
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '400px', overflowY: 'auto' }}>
                {uploadQueue.map((item) => (
                  <Card
                    key={item.id}
                    sx={{
                      border: '1px solid',
                      borderColor: item.status === 'completed' ? 'success.main' :
                                   item.status === 'failed' ? 'error.main' :
                                   item.status === 'uploading' || item.status === 'retrying' ? 'primary.main' :
                                   'divider',
                      bgcolor: item.status === 'completed' ? 'success.light' :
                              item.status === 'failed' ? 'error.light' :
                              item.status === 'uploading' || item.status === 'retrying' ? 'primary.light' :
                              'background.default'
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.file.name}
                        </Typography>
                        <Chip
                          label={
                            item.status === 'pending' ? '⏳ Pending' :
                            item.status === 'uploading' ? '📤 Uploading' :
                            item.status === 'retrying' ? `🔄 Retrying (${item.retryCount}/${maxRetries})` :
                            item.status === 'completed' ? '✅ Completed' :
                            '❌ Failed'
                          }
                          size="small"
                          color={
                            item.status === 'completed' ? 'success' :
                            item.status === 'failed' ? 'error' :
                            item.status === 'uploading' || item.status === 'retrying' ? 'primary' :
                            'default'
                          }
                          sx={{ ml: 1 }}
                        />
                      </Box>

                      {/* Progress Bar */}
                      {(item.status === 'uploading' || item.status === 'retrying') && (
                        <Box sx={{ mb: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={item.progress} 
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {item.progress}% - {item.uploadedMB?.toFixed(2) || '0'} MB / {item.totalMB?.toFixed(2) || '0'} MB
                            </Typography>
                            {item.speed && item.speed > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {item.speed.toFixed(2)} MB/s
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Error Message */}
                      {item.status === 'failed' && item.error && (
                        <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                          <Typography variant="caption">{item.error}</Typography>
                          {item.retryCount < maxRetries && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              sx={{ mt: 0.5 }}
                              onClick={() => {
                                setUploadQueue(prev => prev.map(i => 
                                  i.id === item.id ? { ...i, status: 'pending', error: undefined } : i
                                ));
                                processUploadQueue();
                              }}
                            >
                              Retry
                            </Button>
                          )}
                        </Alert>
                      )}

                      {/* Success Message */}
                      {item.status === 'completed' && item.streamtapeUrl && (
                        <Alert severity="success" sx={{ mt: 1, py: 0.5 }}>
                          <Typography variant="caption">
                            ✅ Uploaded: <a href={item.streamtapeUrl} target="_blank" rel="noopener noreferrer">{item.streamtapeUrl}</a>
                          </Typography>
                        </Alert>
                      )}

                      {/* File Size */}
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Size: {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Queue Statistics */}
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  Pending: {uploadQueue.filter(i => i.status === 'pending').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Uploading: {uploadQueue.filter(i => i.status === 'uploading' || i.status === 'retrying').length}
                </Typography>
                <Typography variant="caption" color="success.main">
                  Completed: {uploadQueue.filter(i => i.status === 'completed').length}
                </Typography>
                <Typography variant="caption" color="error.main">
                  Failed: {uploadQueue.filter(i => i.status === 'failed').length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Streamtape URL
          </Typography>
          
          {false && embedMode === 'file' ? (
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
                      Video Selected: {selectedFile?.name || 'Unknown'}
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
                  multiple
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
                Streamtape URL added successfully!
              </Alert>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Video Preview
                </Typography>
                <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
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
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <TextField
                fullWidth
                label="Title"
                placeholder="Enter video title..."
                variant="outlined"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                required
              />
            </Box>
            
            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
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
            </Box>

            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <InputLabel>Categories</InputLabel>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => setAddCategoryDialogOpen(true)}
                        sx={{ ml: 'auto' }}
                      >
                        Add Category
                      </Button>
                    </Box>
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
                      {[...customCategories].sort((a, b) => a.name.localeCompare(b.name)).map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <InputLabel>Models</InputLabel>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => setAddModelDialogOpen(true)}
                        sx={{ ml: 'auto' }}
                      >
                        Add Model
                      </Button>
                    </Box>
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
                      {[...models].sort((a, b) => a.name.localeCompare(b.name)).map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                          {model.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <InputLabel>Channels</InputLabel>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => setAddChannelDialogOpen(true)}
                        sx={{ ml: 'auto' }}
                      >
                        Add Channel
                      </Button>
                    </Box>
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
                      {[...channels].sort((a, b) => a.name.localeCompare(b.name)).map((channel) => (
                        <MenuItem key={channel.id} value={channel.id}>
                          {channel.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

            <Box sx={{ gridColumn: { xs: '1', md: '1' } }}>
              <TextField
                fullWidth
                label="Video Duration"
                placeholder="e.g., 5:30, 12:45, 1:23:15"
                value={videoDuration}
                onChange={(e) => setVideoDuration(e.target.value)}
                variant="outlined"
                helperText="Format: MM:SS or HH:MM:SS"
              />
            </Box>

            <Box sx={{ gridColumn: { xs: '1', md: '2' } }}>
              <TextField
                fullWidth
                label="Tags"
                placeholder="Enter tags separated by commas or press Enter..."
                variant="outlined"
                helperText="Type a tag and press comma or Enter to add it"
                value={videoTags}
                onChange={handleTagsChange}
                onKeyPress={handleTagsKeyPress}
              />
              {videoTagsArray.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {videoTagsArray.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleDeleteTag(tag)}
                      color="primary"
                      variant="outlined"
                      sx={{
                        color: '#ffffff',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        '& .MuiChip-label': {
                          color: '#ffffff',
                        },
                        '& .MuiChip-deleteIcon': {
                          color: '#ffffff',
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
              
              {/* Saved Tags Suggestions */}
              {savedTags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                    Previously used tags:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {savedTags
                      .filter(tag => !videoTagsArray.includes(tag) && !videoTagsArray.map(t => t.toLowerCase()).includes(tag.toLowerCase()))
                      .map((tag, index) => (
                        <Chip
                          key={index}
                          label={`+ ${tag}`}
                          onClick={() => handleAddSavedTag(tag)}
                          size="small"
                          sx={{
                            cursor: 'pointer',
                            bgcolor: 'rgba(180, 2, 2, 0.1)',
                            color: '#ffffff',
                            border: '1px solid rgba(180, 2, 2, 0.3)',
                            '& .MuiChip-label': {
                              color: '#ffffff',
                            },
                            '&:hover': {
                              bgcolor: 'rgba(180, 2, 2, 0.2)',
                              borderColor: 'rgba(180, 2, 2, 0.5)',
                            }
                          }}
                        />
                      ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Bluesky Preview */}
            {(videoTitle.trim() || streamtapeThumbnail || streamtapeThumbnailUrl) && (
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, mt: 2 }}>
                <Card sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                      📱 Bluesky Post Preview
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'rgba(0, 0, 0, 0.3)', 
                      borderRadius: 2, 
                      p: 2,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {(() => {
                        const preview = generateBlueskyPreview(
                          videoTitle || 'Video Title',
                          videoDescription,
                          streamtapeThumbnail || streamtapeThumbnailUrl || null,
                          selectedModelIds,
                          selectedCategoryIds
                        );
                        return (
                          <>
                            {preview.thumbnail && (
                              <Box sx={{ mb: 2, borderRadius: 1, overflow: 'hidden' }}>
                                <img 
                                  src={preview.thumbnail} 
                                  alt="Thumbnail" 
                                  style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }}
                                />
                              </Box>
                            )}
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                whiteSpace: 'pre-wrap',
                                color: 'text.primary',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                lineHeight: 1.6
                              }}
                            >
                              {preview.text}
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}

            <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
                        uploadDate: video.created_at || new Date().toISOString(),
                        title: video.title || 'Untitled Video' // Ensure title is always present
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
            
            {/* Bluesky Preview in Edit Dialog */}
            {(editTitle.trim() || editThumbnailUrl) && (
              <Box sx={{ mt: 2 }}>
                <Card sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                      📱 Bluesky Post Preview
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'rgba(0, 0, 0, 0.3)', 
                      borderRadius: 2, 
                      p: 2,
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {(() => {
                        const preview = generateBlueskyPreview(
                          editTitle || 'Video Title',
                          editDescription,
                          editThumbnailUrl || null,
                          editModelIds,
                          editCategoryIds,
                          editingVideo?.slug
                        );
                        return (
                          <>
                            {preview.thumbnail && (
                              <Box sx={{ mb: 2, borderRadius: 1, overflow: 'hidden' }}>
                                <img 
                                  src={preview.thumbnail} 
                                  alt="Thumbnail" 
                                  style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }}
                                />
                              </Box>
                            )}
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                whiteSpace: 'pre-wrap',
                                color: 'text.primary',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                lineHeight: 1.6
                              }}
                            >
                              {preview.text}
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editTitle.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Model Dialog */}
      <Dialog open={addModelDialogOpen} onClose={() => setAddModelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Model</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Model Name"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              fullWidth
              required
              placeholder="Enter model name"
            />
            <TextField
              label="Image URL (imgbb direct link)"
              value={newModelImageUrl}
              onChange={(e) => setNewModelImageUrl(e.target.value)}
              fullWidth
              placeholder="https://i.ibb.co/xxxxx/image.jpg"
              helperText="💡 Upload your image to imgbb.com first, then paste the direct link here"
            />
            {newModelImageUrl.trim() && (
              <Box sx={{ 
                p: 2,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  Image Preview
                </Typography>
                <img
                  src={newModelImageUrl.trim()}
                  alt="Preview"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '8px',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="trans-checkbox"
                checked={newModelIsTrans}
                onChange={(e) => setNewModelIsTrans(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="trans-checkbox" style={{ cursor: 'pointer', color: 'inherit' }}>
                Trans (Ts)
              </label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddModelDialogOpen(false);
            setNewModelName('');
            setNewModelImageUrl('');
            setNewModelIsTrans(false);
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddModel} variant="contained" disabled={!newModelName.trim()}>
            Add Model
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryDialogOpen} onClose={() => setAddCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              required
              placeholder="Enter category name"
            />
            <TextField
              label="Thumbnail URL (imgbb direct link)"
              value={newCategoryThumbnailUrl}
              onChange={(e) => setNewCategoryThumbnailUrl(e.target.value)}
              fullWidth
              placeholder="https://i.ibb.co/xxxxx/image.jpg"
              helperText="💡 Upload your image to imgbb.com first, then paste the direct link here"
            />
            {newCategoryThumbnailUrl.trim() && (
              <Box sx={{ 
                p: 2,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  Thumbnail Preview
                </Typography>
                <img
                  src={newCategoryThumbnailUrl.trim()}
                  alt="Preview"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '8px',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddCategoryDialogOpen(false);
            setNewCategoryName('');
            setNewCategoryThumbnailUrl('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddCategory} variant="contained" disabled={!newCategoryName.trim()}>
            Add Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Channel Dialog */}
      <Dialog open={addChannelDialogOpen} onClose={() => setAddChannelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Channel</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Channel Name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              fullWidth
              required
              placeholder="Enter channel name"
            />
            <TextField
              label="Description"
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Enter channel description (optional)"
            />
            <TextField
              label="Thumbnail URL (imgbb direct link)"
              value={newChannelThumbnailUrl}
              onChange={(e) => setNewChannelThumbnailUrl(e.target.value)}
              fullWidth
              placeholder="https://i.ibb.co/xxxxx/image.jpg"
              helperText="💡 Upload your image to imgbb.com first, then paste the direct link here"
            />
            {newChannelThumbnailUrl.trim() && (
              <Box sx={{ 
                p: 2,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  Thumbnail Preview
                </Typography>
                <img
                  src={newChannelThumbnailUrl.trim()}
                  alt="Preview"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '8px',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddChannelDialogOpen(false);
            setNewChannelName('');
            setNewChannelDescription('');
            setNewChannelThumbnailUrl('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddChannel} variant="contained" disabled={!newChannelName.trim()}>
            Add Channel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Upload;
