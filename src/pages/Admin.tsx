import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Alert,
  Snackbar,
  CardMedia,
} from '@mui/material';
import { Add, Delete, Edit, Save, Cancel, Visibility, CloudUpload, Delete as DeleteIcon, Person, Block, CheckCircle, CheckCircle as SelectIcon, Image as ImageIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { categoryService, modelService, channelService, profileService, banUserService, notificationService, settingsService, backgroundImageService } from '../services/database';
import { Category, Model, Channel, Profile, BanUser, BackgroundImage } from '../lib/supabase';
import { Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { validateImageFile } from '../utils/validation';
import { toast } from 'react-hot-toast';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
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

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [bans, setBans] = useState<BanUser[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUserForBan, setSelectedUserForBan] = useState<Profile | null>(null);
  const [banType, setBanType] = useState<string>('5_days');
  const [banReason, setBanReason] = useState<string>('');
  const [newModel, setNewModel] = useState('');
  const [newChannel, setNewChannel] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [editModelValue, setEditModelValue] = useState('');
  const [categoryThumbnail, setCategoryThumbnail] = useState<File | null>(null);
  const [categoryThumbnailPreview, setCategoryThumbnailPreview] = useState<string | null>(null);
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [modelImagePreview, setModelImagePreview] = useState<string | null>(null);
  const [channelThumbnail, setChannelThumbnail] = useState<File | null>(null);
  const [channelThumbnailPreview, setChannelThumbnailPreview] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
  const [backgroundImageSize, setBackgroundImageSize] = useState<number>(0);
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
  const [libraryImages, setLibraryImages] = useState<Array<{
    file: File;
    preview: string;
    name: string;
    size: number;
  }>>([]);
  const [heroTitle, setHeroTitle] = useState<string>('');
  const [heroSubtitle, setHeroSubtitle] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load data from localStorage and Supabase on component mount
  useEffect(() => {
    const loadData = async () => {
      // Load from Supabase
      try {
        const supabaseModels = await modelService.getAll();
        setModels(supabaseModels);
      } catch (error) {
        console.error('Failed to load models from Supabase:', error);
        // Models are only stored in Supabase, no localStorage fallback
      }

      // Load channels from Supabase
      try {
        const supabaseChannels = await channelService.getAll();
        setChannels(supabaseChannels);
      } catch (error) {
        console.error('Failed to load channels from Supabase:', error);
        // Channels are only stored in Supabase, no localStorage fallback
      }

      // Load users from Supabase
      try {
        const supabaseUsers = await profileService.getAll();
        setUsers(supabaseUsers);
      } catch (error) {
        console.error('Failed to load users from Supabase:', error);
      }

      // Load bans from Supabase
      try {
        const supabaseBans = await banUserService.getAll();
        setBans(supabaseBans);
      } catch (error) {
        console.error('Failed to load bans from Supabase:', error);
      }

      // Load background image from Supabase
      try {
        const bgImage = await settingsService.getValue('homepage_background_image');
        if (bgImage) {
          setBackgroundImagePreview(bgImage);
        }
      } catch (error) {
        console.error('Failed to load background image:', error);
      }

      // Load hero title from Supabase
      try {
        const title = await settingsService.getValue('homepage_hero_title');
        setHeroTitle(title || '');
      } catch (error) {
        console.error('Failed to load hero title:', error);
      }

      // Load hero subtitle from Supabase
      try {
        const subtitle = await settingsService.getValue('homepage_hero_subtitle');
        setHeroSubtitle(subtitle || '');
      } catch (error) {
        console.error('Failed to load hero subtitle:', error);
      }

      // Load background images library
      try {
        const images = await backgroundImageService.getAll();
        setBackgroundImages(images);
      } catch (error) {
        console.error('Failed to load background images:', error);
      }
    };

    loadData();

    // Load categories from Supabase
    const loadCategories = async () => {
      try {
        const supabaseCategories = await categoryService.getAll();
        setCategories(supabaseCategories);
      } catch (error) {
        console.error('Failed to load categories from Supabase:', error);
      }
    };
    
    loadCategories();
  }, []);


  // Models and Channels are stored in Supabase only, not in localStorage to avoid quota exceeded error

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Category functions
  const handleCategoryThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Geçersiz resim dosyası');
        event.target.value = ''; // Reset input
        return;
      }

      setCategoryThumbnail(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCategoryThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCategoryThumbnail = () => {
    setCategoryThumbnail(null);
    setCategoryThumbnailPreview(null);
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() && !categories.some(cat => cat.name === newCategory.trim())) {
      try {
        const newCategoryData = await categoryService.create({
          name: newCategory.trim(),
          thumbnail: categoryThumbnailPreview,
        });
        
        setCategories([...categories, newCategoryData]);
        setNewCategory('');
        setCategoryThumbnail(null);
        setCategoryThumbnailPreview(null);
        showSnackbar('Category added successfully!');
      } catch (error) {
        console.error('Failed to add category:', error);
        showSnackbar('Failed to add category!', 'error');
      }
    } else if (categories.some(cat => cat.name === newCategory.trim())) {
      showSnackbar('Category already exists!', 'error');
    }
  };

  const handleEditCategory = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditCategoryValue(categoryName);
  };

  const handleSaveCategory = async () => {
    if (editCategoryValue.trim() && !categories.some(cat => cat.name === editCategoryValue.trim())) {
      try {
        const categoryToUpdate = categories.find(cat => cat.name === editingCategory);
        if (categoryToUpdate) {
          await categoryService.update(categoryToUpdate.id, {
            name: editCategoryValue.trim(),
          });
          
          const updatedCategories = categories.map(cat => 
            cat.name === editingCategory ? { ...cat, name: editCategoryValue.trim() } : cat
          );
          setCategories(updatedCategories);
          setEditingCategory(null);
          setEditCategoryValue('');
          showSnackbar('Category updated successfully!');
        }
      } catch (error) {
        console.error('Failed to update category:', error);
        showSnackbar('Failed to update category!', 'error');
      }
    } else if (categories.some(cat => cat.name === editCategoryValue.trim())) {
      showSnackbar('Category already exists!', 'error');
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryValue('');
  };

  const handleDeleteCategory = async (categoryName: string) => {
    try {
      const categoryToDelete = categories.find(cat => cat.name === categoryName);
      if (categoryToDelete) {
        await categoryService.delete(categoryToDelete.id);
        setCategories(categories.filter(cat => cat.name !== categoryName));
        showSnackbar('Category deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      showSnackbar('Failed to delete category!', 'error');
    }
  };

  // Model functions
  const handleModelImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Geçersiz resim dosyası');
        event.target.value = ''; // Reset input
        return;
      }

      setModelImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setModelImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveModelImage = () => {
    setModelImage(null);
    setModelImagePreview(null);
  };

  const handleAddModel = async () => {
    if (newModel.trim() && !models.some(m => m.name === newModel.trim())) {
      try {
        // First try to save to Supabase
        await modelService.create({
          name: newModel.trim(),
          image: modelImagePreview
        });
        
        // Then update local state
        const newModelData: Model = {
          id: Date.now().toString(),
          name: newModel.trim(),
          image: modelImagePreview,
          created_at: new Date().toISOString()
        };
        setModels([...models, newModelData]);
        setNewModel('');
        setModelImage(null);
        setModelImagePreview(null);
        showSnackbar('Model added successfully!');
      } catch (error) {
        console.error('Failed to save model to Supabase:', error);
        // Fallback to local state only
        const newModelData: Model = {
          id: Date.now().toString(),
          name: newModel.trim(),
          image: modelImagePreview,
          created_at: new Date().toISOString()
        };
        setModels([...models, newModelData]);
        setNewModel('');
        setModelImage(null);
        setModelImagePreview(null);
        showSnackbar('Model added successfully (local only)!');
      }
    } else if (models.some(m => m.name === newModel.trim())) {
      showSnackbar('Model already exists!', 'error');
    }
  };

  const handleEditModel = (modelName: string) => {
    setEditingModel(modelName);
    setEditModelValue(modelName);
  };

  const handleSaveModel = () => {
    if (editModelValue.trim() && !models.some(m => m.name === editModelValue.trim())) {
      const updatedModels = models.map(m => 
        m.name === editingModel ? { ...m, name: editModelValue.trim() } : m
      );
      setModels(updatedModels);
      setEditingModel(null);
      setEditModelValue('');
      showSnackbar('Model updated successfully!');
    } else if (models.some(m => m.name === editModelValue.trim())) {
      showSnackbar('Model already exists!', 'error');
    }
  };

  const handleCancelEditModel = () => {
    setEditingModel(null);
    setEditModelValue('');
  };

  const handleDeleteModel = (modelName: string) => {
    setModels(models.filter(m => m.name !== modelName));
    showSnackbar('Model deleted successfully!');
  };

  // Channel functions
  const handleChannelThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Geçersiz resim dosyası');
        event.target.value = ''; // Reset input
        return;
      }

      setChannelThumbnail(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setChannelThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveChannelThumbnail = () => {
    setChannelThumbnail(null);
    setChannelThumbnailPreview(null);
  };

  const handleAddChannel = async () => {
    if (newChannel.trim() && !channels.some(c => c.name === newChannel.trim())) {
      try {
        // First try to save to Supabase
        await channelService.create({
          name: newChannel.trim(),
          description: newChannelDescription,
          thumbnail: channelThumbnailPreview,
          banner: null
        });
        
        // Then update local state
        const newChannelData: Channel = {
          id: Date.now().toString(),
          name: newChannel.trim(),
          description: newChannelDescription,
          thumbnail: channelThumbnailPreview,
          banner: null,
          subscriber_count: 0,
          created_at: new Date().toISOString()
        };
        setChannels([...channels, newChannelData]);
        setNewChannel('');
        setNewChannelDescription('');
        setChannelThumbnail(null);
        setChannelThumbnailPreview(null);
        showSnackbar('Channel added successfully!');
      } catch (error) {
        console.error('Failed to save channel to Supabase:', error);
        // Fallback to local state only
        const newChannelData: Channel = {
          id: Date.now().toString(),
          name: newChannel.trim(),
          description: newChannelDescription,
          thumbnail: channelThumbnailPreview,
          banner: null,
          subscriber_count: 0,
          created_at: new Date().toISOString()
        };
        setChannels([...channels, newChannelData]);
        setNewChannel('');
        setNewChannelDescription('');
        setChannelThumbnail(null);
        setChannelThumbnailPreview(null);
        showSnackbar('Channel added successfully (local only)!');
      }
    } else if (channels.some(c => c.name === newChannel.trim())) {
      showSnackbar('Channel already exists!', 'error');
    }
  };

  const handleDeleteChannel = (channelName: string) => {
    setChannels(channels.filter(c => c.name !== channelName));
    showSnackbar('Channel deleted successfully!');
  };

  // Ban user functions
  const handleOpenBanDialog = (user: Profile) => {
    setSelectedUserForBan(user);
    setBanDialogOpen(true);
  };

  const handleCloseBanDialog = () => {
    setBanDialogOpen(false);
    setSelectedUserForBan(null);
    setBanType('5_days');
    setBanReason('');
  };

  const handleBanUser = async () => {
    if (!selectedUserForBan) return;
    
    try {
      await banUserService.createBan(
        selectedUserForBan.user_name,
        banReason || null,
        banType
      );

      // Send notification to banned user
      const banTypeFormatted = banType.replace(/_/g, ' ');
      await notificationService.create({
        user_id: selectedUserForBan.user_name,
        type: 'ban',
        title: 'You Have Been Banned',
        message: `You have been banned for ${banTypeFormatted}. ${banReason ? 'Reason: ' + banReason : ''}`,
      });
      
      showSnackbar('User banned successfully!');
      handleCloseBanDialog();
      
      // Reload bans and users
      const supabaseBans = await banUserService.getAll();
      setBans(supabaseBans);
    } catch (error) {
      console.error('Failed to ban user:', error);
      showSnackbar('Failed to ban user! ' + (error as any).message, 'error');
    }
  };

  const isUserBanned = (username: string): boolean => {
    return bans.some(b => b.user_id === username && b.is_active && (!b.expires_at || new Date(b.expires_at) > new Date()));
  };

  const getBanInfo = (username: string) => {
    return bans.find(b => b.user_id === username && b.is_active && (!b.expires_at || new Date(b.expires_at) > new Date()));
  };

  const handleUnbanUser = async (username: string) => {
    try {
      const activeBan = getBanInfo(username);
      if (activeBan) {
        await banUserService.unbanUser(activeBan.id);
        showSnackbar('User unbanned successfully!');
        
        // Reload bans
        const supabaseBans = await banUserService.getAll();
        setBans(supabaseBans);
      }
    } catch (error) {
      console.error('Failed to unban user:', error);
      showSnackbar('Failed to unban user!', 'error');
    }
  };

  const handleBackgroundImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Geçersiz resim dosyası');
        event.target.value = ''; // Reset input
        return;
      }

      setBackgroundImage(file);
      setBackgroundImageSize(file.size);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setBackgroundImagePreview(base64Image);
        
        // Save to Supabase
        try {
          await settingsService.upsert('homepage_background_image', base64Image);
          toast.success('Background image saved successfully!');
        } catch (error) {
          console.error('Failed to save background image:', error);
          toast.error('Failed to save background image!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackgroundImage = async () => {
    setBackgroundImage(null);
    setBackgroundImagePreview(null);
    setBackgroundImageSize(0);
    
    // Remove from Supabase
    try {
      await settingsService.upsert('homepage_background_image', '');
      toast.success('Background image removed successfully!');
    } catch (error) {
      console.error('Failed to remove background image:', error);
      toast.error('Failed to remove background image!');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSaveHeroTitle = async () => {
    try {
      const valueToSave = heroTitle.trim() === '' ? null : heroTitle.trim();
      await settingsService.upsert('homepage_hero_title', valueToSave);
      toast.success('Hero title saved successfully!');
      // Reload the title to ensure sync
      try {
        const title = await settingsService.getValue('homepage_hero_title');
        setHeroTitle(title || '');
      } catch (err) {
        console.error('Failed to reload hero title:', err);
      }
    } catch (error) {
      console.error('Failed to save hero title:', error);
      toast.error('Failed to save hero title!');
    }
  };

  const handleSaveHeroSubtitle = async () => {
    try {
      const valueToSave = heroSubtitle.trim() === '' ? null : heroSubtitle.trim();
      await settingsService.upsert('homepage_hero_subtitle', valueToSave);
      toast.success('Hero subtitle saved successfully!');
      // Reload the subtitle to ensure sync
      try {
        const subtitle = await settingsService.getValue('homepage_hero_subtitle');
        setHeroSubtitle(subtitle || '');
      } catch (err) {
        console.error('Failed to reload hero subtitle:', err);
      }
    } catch (error) {
      console.error('Failed to save hero subtitle:', error);
      toast.error('Failed to save hero subtitle!');
    }
  };

  // Library Image Upload Handler (Multiple files)
  const handleLibraryImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newImages: Array<{
      file: File;
      preview: string;
      name: string;
      size: number;
    }> = [];

    let processedCount = 0;

    // Process each file
    fileArray.forEach((file, index) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(`Image ${index + 1}: ${validation.error || 'Invalid image file'}`);
        processedCount++;
        if (processedCount === fileArray.length && newImages.length > 0) {
          setLibraryImages((prev) => [...prev, ...newImages]);
        }
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = {
          file,
          preview: reader.result as string,
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for name
          size: file.size,
        };
        newImages.push(imageData);
        processedCount++;

        // If all files are processed, update state
        if (processedCount === fileArray.length) {
          setLibraryImages((prev) => [...prev, ...newImages]);
        }
      };
      reader.onerror = () => {
        toast.error(`Failed to load image ${index + 1}`);
        processedCount++;
        if (processedCount === fileArray.length && newImages.length > 0) {
          setLibraryImages((prev) => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
  };

  // Save All Library Images to Database
  const handleSaveLibraryImage = async () => {
    if (libraryImages.length === 0) {
      toast.error('Please select at least one image first');
      return;
    }

    // Check if all images have names
    const imagesWithoutNames = libraryImages.filter(img => !img.name.trim());
    if (imagesWithoutNames.length > 0) {
      toast.error('Please enter names for all images');
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      // Save each image
      for (const imageData of libraryImages) {
        try {
          // Get image dimensions
          const img = new Image();
          
          // Wait for image to load
          const imageLoadPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
            let timeoutId: NodeJS.Timeout;
            
            img.onload = () => {
              clearTimeout(timeoutId);
              resolve({ width: img.width, height: img.height });
            };
            img.onerror = () => {
              clearTimeout(timeoutId);
              reject(new Error('Failed to load image'));
            };
            
            // Set timeout for image loading (10 seconds)
            timeoutId = setTimeout(() => {
              reject(new Error('Image loading timeout'));
            }, 10000);
            
            img.src = imageData.preview;
          });

          const { width, height } = await imageLoadPromise;

          // Save to database
          await backgroundImageService.create(
            imageData.name.trim(),
            imageData.preview,
            imageData.size,
            width,
            height
          );

          successCount++;
        } catch (error: any) {
          console.error(`Failed to save image "${imageData.name}":`, error);
          failCount++;
        }
      }

      // Reload library images
      const images = await backgroundImageService.getAll();
      setBackgroundImages(images);

      // Reset form
      setLibraryImages([]);

      if (successCount > 0 && failCount === 0) {
        toast.success(`${successCount} image(s) added to library successfully!`);
      } else if (successCount > 0 && failCount > 0) {
        toast.success(`${successCount} image(s) saved, ${failCount} failed`);
      } else {
        toast.error(`Failed to save images. Please check console for details.`);
      }
    } catch (error: any) {
      console.error('Failed to save library images:', error);
      toast.error('Failed to save library images!');
    }
  };

  // Delete Library Image
  const handleDeleteLibraryImage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await backgroundImageService.delete(id);
      
      // Reload library images
      const images = await backgroundImageService.getAll();
      setBackgroundImages(images);

      toast.success('Image deleted successfully!');
    } catch (error) {
      console.error('Failed to delete library image:', error);
      toast.error('Failed to delete library image!');
    }
  };

  // Select Library Image as Homepage Background
  const handleSelectLibraryImage = async (imageData: string) => {
    try {
      await settingsService.upsert('homepage_background_image', imageData);
      
      // Update preview
      setBackgroundImagePreview(imageData);
      
      toast.success('Background image updated from library!');
      
      // Reload background image from settings
      try {
        const bgImage = await settingsService.getValue('homepage_background_image');
        if (bgImage) {
          setBackgroundImagePreview(bgImage);
        }
      } catch (err) {
        console.error('Failed to reload background image:', err);
      }
    } catch (error) {
      console.error('Failed to set background image:', error);
      toast.error('Failed to set background image!');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Homepage Background Image Section */}
      <Card sx={{ mb: 4, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Homepage Background Image
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Recommended size: 1920x500px or similar wide aspect ratio
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              Upload Background Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleBackgroundImageUpload}
              />
            </Button>
            {backgroundImagePreview && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleRemoveBackgroundImage}
                sx={{ mb: 2 }}
              >
                Remove
              </Button>
            )}
          </Box>

          {backgroundImagePreview && (
            <Box>
              <Box
                component="img"
                src={backgroundImagePreview}
                alt="Background preview"
                sx={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'cover',
                  borderRadius: 2,
                  mb: 2,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                File size: {formatFileSize(backgroundImageSize)} ({backgroundImageSize} bytes)
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Background Images Library */}
      <Card sx={{ mb: 4, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Background Images Library
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload and manage background images. Selected images can be used as homepage background.
          </Typography>

          {/* Upload New Image to Library */}
          <Box sx={{ mb: 4, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add New Images to Library
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              You can select multiple images at once
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ width: 'fit-content' }}
              >
                Select Images
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleLibraryImageUpload}
                />
              </Button>
              {libraryImages.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Images ({libraryImages.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {libraryImages.map((imageData, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box
                            component="img"
                            src={imageData.preview}
                            alt={imageData.name}
                            sx={{
                              width: 150,
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: 1,
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              fullWidth
                              label="Image Name"
                              placeholder="Enter a name for this image"
                              value={imageData.name}
                              onChange={(e) => {
                                const updated = [...libraryImages];
                                updated[index].name = e.target.value;
                                setLibraryImages(updated);
                              }}
                              variant="outlined"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(imageData.size)} ({imageData.size} bytes)
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const updated = libraryImages.filter((_, i) => i !== index);
                                setLibraryImages(updated);
                              }}
                              sx={{ ml: 1 }}
                              title="Remove image"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveLibraryImage}
                      disabled={libraryImages.length === 0 || libraryImages.some(img => !img.name.trim())}
                    >
                      Save All to Library
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setLibraryImages([]);
                      }}
                    >
                      Clear All
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Library Images Grid */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 2 }}>
            Library Images ({backgroundImages.length})
          </Typography>
          {backgroundImages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No images in library yet. Upload your first image above.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 2,
              }}
            >
              {backgroundImages.map((image) => (
                <Card
                  key={image.id}
                  sx={{
                    position: 'relative',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '&:hover': {
                      borderColor: 'rgba(255,107,107,0.3)',
                      boxShadow: '0 4px 12px rgba(255,107,107,0.2)',
                    },
                  }}
                >
                  <CardMedia
                    sx={{
                      height: 200,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      component="img"
                      src={image.image_data}
                      alt={image.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        display: 'flex',
                        gap: 0.5,
                        p: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleSelectLibraryImage(image.image_data)}
                        sx={{
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                        }}
                        title="Select as homepage background"
                      >
                        <SelectIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteLibraryImage(image.id)}
                        sx={{
                          bgcolor: 'rgba(255,0,0,0.7)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(255,0,0,0.9)' },
                        }}
                        title="Delete image"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardMedia>
                  <CardContent>
                    <Typography variant="subtitle2" noWrap>
                      {image.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(image.file_size)} • {image.width}x{image.height}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(image.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Hero Text Section */}
      <Card sx={{ mb: 4, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Hero Banner Text
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Hero Title (Leave empty to hide)"
              placeholder="Welcome to AdultTube"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
              helperText="Leave empty to hide the title on homepage"
            />
            <Button
              variant="contained"
              onClick={handleSaveHeroTitle}
            >
              Save Title
            </Button>
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Hero Subtitle (Leave empty to hide)"
              placeholder="Premium Adult Content"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
              helperText="Leave empty to hide the subtitle on homepage"
            />
            <Button
              variant="contained"
              onClick={handleSaveHeroSubtitle}
            >
              Save Subtitle
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box>
        <Typography variant="h4" component="h1" gutterBottom className="gradient-text">
          Admin Panel
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage categories and models for your video platform
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab label="Categories" />
            <Tab label="Models" />
            <Tab label="Channels" />
            <Tab label="Users" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Manage Categories
            </Typography>
            
            {/* Add Category Form */}
            <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add New Category
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Category Name"
                    placeholder="Enter category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    variant="outlined"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim()}
                    sx={{ minWidth: 120 }}
                  >
                    Add Category
                  </Button>
                </Box>
                
                {/* Category Thumbnail Upload */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Category Thumbnail (Optional)
                  </Typography>
                  <Box
                    sx={{
                      border: categoryThumbnailPreview ? '2px solid #4caf50' : '2px dashed #ccc',
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {categoryThumbnailPreview ? (
                      <Box>
                        <img
                          src={categoryThumbnailPreview}
                          alt="Category thumbnail preview"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '120px',
                            width: 'auto',
                            height: 'auto',
                            borderRadius: '8px',
                            marginBottom: '8px'
                          }}
                          onError={(e) => {
                            console.error('Preview image load error:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleRemoveCategoryThumbnail}
                            size="small"
                          >
                            Remove
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Click to upload category thumbnail
                        </Typography>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCategoryThumbnailUpload}
                          style={{ display: 'none' }}
                          id="category-thumbnail-upload"
                        />
                        <label htmlFor="category-thumbnail-upload">
                          <Button 
                            variant="outlined" 
                            component="span" 
                            startIcon={<Add />}
                          >
                            Choose Thumbnail
                          </Button>
                        </label>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Categories List */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Existing Categories ({categories.length})
            </Typography>
            
            {categories.length === 0 ? (
              <Alert severity="info">
                No categories found. Add some categories to get started.
              </Alert>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)' 
                }, 
                gap: 2 
              }}>
                {categories.map((category, index) => (
                  <Box
                    key={category.name}
                  >
                    <Card sx={{ 
                      bgcolor: 'background.paper',
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease'
                      }
                    }}>
                      <CardContent>
                        {editingCategory === category.name ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              fullWidth
                              value={editCategoryValue}
                              onChange={(e) => setEditCategoryValue(e.target.value)}
                              size="small"
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveCategory()}
                            />
                            <IconButton 
                              color="primary" 
                              onClick={handleSaveCategory}
                              size="small"
                            >
                              <Save />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={handleCancelEditCategory}
                              size="small"
                            >
                              <Cancel />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box>
                            <Box sx={{ 
                              height: 120,
                              background: category.thumbnail 
                                ? `url(${category.thumbnail})` 
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderRadius: 1,
                              position: 'relative',
                              overflow: 'hidden',
                              mb: 2,
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: category.thumbnail 
                                  ? 'rgba(0, 0, 0, 0.3)' 
                                  : 'transparent',
                                zIndex: 1,
                              }
                            }}>
                              <Box sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                right: 8,
                                zIndex: 2,
                                textAlign: 'center'
                              }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    color: 'white',
                                    fontWeight: 600,
                                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                    fontSize: '1rem'
                                  }}
                                >
                                  {category.name}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                                {category.thumbnail ? 'Has thumbnail' : 'No thumbnail'}
                              </Typography>
                              <Box>
                                <IconButton 
                                  color="primary" 
                                  onClick={() => handleEditCategory(category.name)}
                                  size="small"
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleDeleteCategory(category.name)}
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Manage Models
              </Typography>
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    // Get all models from localStorage
                    const savedModels = localStorage.getItem('adminModels');
                    if (savedModels) {
                      const localModels = JSON.parse(savedModels);
                      let successCount = 0;
                      let errorCount = 0;
                      
                      for (const model of localModels) {
                        try {
                          await modelService.create({
                            name: model.name,
                            image: model.image
                          });
                          successCount++;
                        } catch (error) {
                          console.error(`Failed to sync model ${model.name}:`, error);
                          errorCount++;
                        }
                      }
                      
                      if (successCount > 0) {
                        showSnackbar(`${successCount} model(s) synced to Supabase successfully!`);
                      } else {
                        showSnackbar('No models to sync or all failed', 'error');
                      }
                    } else {
                      showSnackbar('No models in localStorage to sync', 'error');
                    }
                  } catch (error) {
                    console.error('Failed to sync models:', error);
                    showSnackbar('Failed to sync models to Supabase', 'error');
                  }
                }}
                sx={{ minWidth: 200 }}
              >
                Sync to Supabase
              </Button>
            </Box>
            
            {/* Add Model Form */}
            <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add New Model
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Model Name"
                    placeholder="Enter model name"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    variant="outlined"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddModel()}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddModel}
                    disabled={!newModel.trim()}
                    sx={{ minWidth: 120 }}
                  >
                    Add Model
                  </Button>
                </Box>
                
                {/* Model Image Upload */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Model Image (Optional)
                  </Typography>
                  <Box
                    sx={{
                      border: modelImagePreview ? '2px solid #4caf50' : '2px dashed #ccc',
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    {modelImagePreview ? (
                      <Box>
                        <img
                          src={modelImagePreview}
                          alt="Model preview"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '250px',
                            width: 'auto',
                            height: 'auto',
                            borderRadius: '8px',
                            marginBottom: '8px'
                          }}
                          onError={(e) => {
                            console.error('Preview image load error:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleRemoveModelImage}
                            size="small"
                          >
                            Remove
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Click to upload model image
                        </Typography>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleModelImageUpload}
                          style={{ display: 'none' }}
                          id="model-image-upload"
                        />
                        <label htmlFor="model-image-upload">
                          <Button 
                            variant="outlined" 
                            component="span" 
                            startIcon={<Add />}
                          >
                            Choose Image
                          </Button>
                        </label>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Models List */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Existing Models ({models.length})
            </Typography>
            
            {models.length === 0 ? (
              <Alert severity="info">
                No models found. Add some models to get started.
              </Alert>
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
                {models.map((model, index) => (
                  <Box
                    key={model.name}
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
                    <Box
                      className="card-3d"
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        position: 'relative',
                        padding: '2px',
                        borderRadius: '16px',
                        background: 'linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                        backgroundSize: '400% 400%',
                        animation: 'gradient-shift 8s ease infinite',
                        '@keyframes gradient-shift': {
                          '0%': { backgroundPosition: '0% 50%' },
                          '50%': { backgroundPosition: '100% 50%' },
                          '100%': { backgroundPosition: '0% 50%' },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: '2px',
                          borderRadius: '14px',
                          background: '#1a1a2e',
                          zIndex: 0,
                        },
                      }}
                    >
                      <Box sx={{ 
                        position: 'relative',
                        zIndex: 1,
                        textAlign: 'center',
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 2,
                        padding: 3
                      }}>
                        {editingModel === model.name ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              fullWidth
                              value={editModelValue}
                              onChange={(e) => setEditModelValue(e.target.value)}
                              size="small"
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveModel()}
                              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                            />
                            <IconButton 
                              color="primary" 
                              onClick={handleSaveModel}
                              size="small"
                            >
                              <Save />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={handleCancelEditModel}
                              size="small"
                            >
                              <Cancel />
                            </IconButton>
                          </Box>
                        ) : (
                          <>
                            {model.image ? (
                              <Box
                                sx={{
                                  mx: 'auto',
                                  filter: 'drop-shadow(0 0 20px rgba(118, 75, 162, 0.8))',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    filter: 'drop-shadow(0 0 30px rgba(118, 75, 162, 1))',
                                    transform: 'scale(1.05)',
                                  }
                                }}
                              >
                                <img
                                  src={model.image}
                                  alt={model.name}
                                  style={{
                                    maxWidth: '180px',
                                    maxHeight: '220px',
                                    width: 'auto',
                                    height: 'auto',
                                    border: '3px solid #667eea',
                                    boxShadow: '0 0 20px rgba(118, 75, 162, 0.6)',
                                    borderRadius: '12px',
                                  }}
                                />
                              </Box>
                            ) : (
                              <Box
                                sx={{ 
                                  width: 150, 
                                  height: 150,
                                  mx: 'auto',
                                  border: '3px solid #667eea',
                                  boxShadow: '0 0 20px rgba(118, 75, 162, 0.6)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'rgba(102, 126, 234, 0.2)'
                                }}
                              >
                                <Person sx={{ fontSize: 70, color: 'rgba(255,255,255,0.9)' }} />
                              </Box>
                            )}
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {model.name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <IconButton 
                                color="info" 
                                onClick={() => navigate(`/models/${model.name.toLowerCase().replace(/\s+/g, '-')}`)}
                                size="small"
                                title="View Model Page"
                                sx={{ color: 'white' }}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton 
                                color="primary" 
                                onClick={() => handleEditModel(model.name)}
                                size="small"
                                sx={{ color: 'white' }}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton 
                                color="error" 
                                onClick={() => handleDeleteModel(model.name)}
                                size="small"
                                sx={{ color: 'white' }}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Channels Tab Panel */}
        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Manage Channels
            </Typography>
            
            {/* Add Channel Form */}
            <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add New Channel
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Channel Name"
                    placeholder="Enter channel name"
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Description"
                    placeholder="Enter channel description"
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                    variant="outlined"
                    multiline
                    rows={3}
                  />
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {channelThumbnailPreview ? (
                      <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <img
                          src={channelThumbnailPreview}
                          alt="Channel thumbnail preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            width: 'auto',
                            height: 'auto',
                            borderRadius: '8px',
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={handleRemoveChannelThumbnail}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Click to upload channel thumbnail
                        </Typography>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleChannelThumbnailUpload}
                          style={{ display: 'none' }}
                          id="channel-thumbnail-upload"
                        />
                        <label htmlFor="channel-thumbnail-upload">
                          <Button variant="outlined" component="span" startIcon={<CloudUpload />}>
                            Choose Thumbnail
                          </Button>
                        </label>
                      </Box>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddChannel}
                    disabled={!newChannel.trim()}
                    sx={{ width: '100%' }}
                  >
                    Add Channel
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Channels List */}
            {channels.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No channels yet. Add your first channel above.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                {channels.map((channel) => (
                  <Box
                    key={channel.id}
                  >
                    <Card sx={{ bgcolor: 'background.paper' }}>
                      <CardContent>
                        {channel.thumbnail ? (
                          <Box sx={{ mb: 2 }}>
                            <img
                              src={channel.thumbnail}
                              alt={channel.name}
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                              }}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', height: 120, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              No thumbnail
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>
                              {channel.name}
                            </Typography>
                            {channel.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {channel.description}
                              </Typography>
                            )}
                            <Chip
                              label={`${channel.subscriber_count} subscribers`}
                              size="small"
                              sx={{ bgcolor: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              color="info"
                              onClick={() => window.open(`/channels/${channel.name.toLowerCase().replace(/\s+/g, '-')}`, '_blank')}
                              size="small"
                              title="View Channel Page"
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteChannel(channel.name)}
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Users Tab Panel */}
        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Manage Users ({users.length})
            </Typography>
            
            {users.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  No users found.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {users.map((user) => (
                  <Card key={user.id} sx={{ bgcolor: 'background.paper' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          {user.avatar_image ? (
                            <Box
                              component="img"
                              src={user.avatar_image}
                              alt={user.user_name}
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                bgcolor: 'rgba(255,107,107,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Person />
                            </Box>
                          )}
                          <Box>
                            <Typography variant="h6">
                              {user.user_name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Chip
                                label={`${user.subscriber_count} subscribers`}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}
                              />
                              <Chip
                                label={`${user.videos_watched} videos watched`}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}
                              />
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </Typography>
                          {isUserBanned(user.user_name) && (
                            <Chip
                              label="BANNED"
                              size="small"
                              color="error"
                              sx={{ width: 'fit-content' }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!isUserBanned(user.user_name) ? (
                            <IconButton
                              color="error"
                              onClick={() => handleOpenBanDialog(user)}
                              size="small"
                              title="Ban User"
                            >
                              <Block />
                            </IconButton>
                          ) : (
                            <>
                              <Chip
                                label={(getBanInfo(user.user_name)?.ban_type || 'Banned').replace(/_/g, ' ')}
                                size="small"
                                color="error"
                              />
                              <IconButton
                                color="success"
                                onClick={() => handleUnbanUser(user.user_name)}
                                size="small"
                                title="Unban User"
                              >
                                <CheckCircle />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </TabPanel>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onClose={handleCloseBanDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Ban User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Typography variant="body1">
              Banning: <strong>{selectedUserForBan?.user_name}</strong>
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Ban Duration</InputLabel>
              <Select
                value={banType}
                onChange={(e) => setBanType(e.target.value)}
                label="Ban Duration"
              >
                <MenuItem value="5_days">5 Days</MenuItem>
                <MenuItem value="10_days">10 Days</MenuItem>
                <MenuItem value="1_month">1 Month</MenuItem>
                <MenuItem value="3_months">3 Months</MenuItem>
                <MenuItem value="6_months">6 Months</MenuItem>
                <MenuItem value="lifetime">Lifetime</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Reason (Optional)"
              multiline
              rows={3}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter ban reason..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBanDialog}>Cancel</Button>
          <Button onClick={handleBanUser} variant="contained" color="error">
            Ban User
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Admin;
