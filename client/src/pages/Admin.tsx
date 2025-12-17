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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { categoryService, modelService, channelService, profileService, banUserService, notificationService, pollService, pollOptionService, pollResponseService, videoService } from '../services/database';
import { emailApi } from '../services/emailApi';
import { metadataApi, ModelMetadata } from '../services/metadataApi';
import { Category, Model, Channel, Profile, BanUser, Poll, PollOption, Video } from '../lib/supabase';
import { Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl, CircularProgress, Switch, FormControlLabel } from '@mui/material';
import { Add, Delete, Edit, Save, Cancel, Visibility, VisibilityOff, CloudUpload, Delete as DeleteIcon, Person, Block, CheckCircle, Search, Close } from '@mui/icons-material';
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
  const [modelIsTrans, setModelIsTrans] = useState(false);
  const [newChannel, setNewChannel] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [editModelValue, setEditModelValue] = useState('');
  const [editModelImagePreview, setEditModelImagePreview] = useState<string | null>(null);
  const [editModelImageUrl, setEditModelImageUrl] = useState<string>('');
  const [editModelIsTrans, setEditModelIsTrans] = useState(false);
  const [editChannelValue, setEditChannelValue] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');
  const [editChannelThumbnail, setEditChannelThumbnail] = useState<File | null>(null);
  const [editChannelThumbnailPreview, setEditChannelThumbnailPreview] = useState<string | null>(null);
  const [editChannelThumbnailUrl, setEditChannelThumbnailUrl] = useState<string>('');
  const [categoryThumbnail, setCategoryThumbnail] = useState<File | null>(null);
  const [categoryThumbnailPreview, setCategoryThumbnailPreview] = useState<string | null>(null);
  const [categoryThumbnailUrl, setCategoryThumbnailUrl] = useState<string>('');
  const [modelImagePreview, setModelImagePreview] = useState<string | null>(null);
  const [modelImageUrl, setModelImageUrl] = useState<string>('');
  const [modelImageFile, setModelImageFile] = useState<File | null>(null);
  const [channelThumbnail, setChannelThumbnail] = useState<File | null>(null);
  const [channelThumbnailPreview, setChannelThumbnailPreview] = useState<string | null>(null);
  const [channelThumbnailUrl, setChannelThumbnailUrl] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [marketingSubject, setMarketingSubject] = useState('');
  const [marketingHeadline, setMarketingHeadline] = useState('');
  const [marketingMessage, setMarketingMessage] = useState('');
  const [marketingRecipientsInput, setMarketingRecipientsInput] = useState('');
  const [marketingCtaUrl, setMarketingCtaUrl] = useState('');
  const [marketingCtaLabel, setMarketingCtaLabel] = useState('');
  const [marketingUnsubscribeUrl, setMarketingUnsubscribeUrl] = useState('');
  const [marketingSending, setMarketingSending] = useState(false);
  // Metadata scraping states
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [scrapedMetadata, setScrapedMetadata] = useState<ModelMetadata | null>(null);
  // Polls states
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollType, setNewPollType] = useState<'best_model' | 'best_video' | 'content_preference' | 'satisfaction'>('best_model');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [pollOptions, setPollOptions] = useState<{ text: string; value?: string }[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(false);

  // Load data from localStorage and Supabase on component mount
  useEffect(() => {
    const loadData = async () => {
      // Load from Supabase
      try {
        const supabaseModels = await modelService.getAll();
        setModels(supabaseModels);
        if (supabaseModels.length > 0) {
          console.log(`✅ Loaded ${supabaseModels.length} models from Supabase`);
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        const errorCode = error?.code || 'N/A';
        console.warn(`⚠️ Failed to load models from Supabase (${errorCode}): ${errorMessage}`);
        // Models are only stored in Supabase, no localStorage fallback
        setModels([]);
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
      } catch (error: any) {
        console.error('Failed to load users from Supabase:', error);
        // 500 hatası normal olabilir (tablo boş veya RLS sorunu) - sadece logla
        if (error?.message) {
          console.warn('Profiles endpoint error (may be normal):', error.message);
        }
        // Users listesini boş bırak
        setUsers([]);
      }

      // Load bans from Supabase
      try {
        const supabaseBans = await banUserService.getAll();
        setBans(supabaseBans);
      } catch (error) {
        console.error('Failed to load bans from Supabase:', error);
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
    
    // Load polls
    const loadPolls = async () => {
      setLoadingPolls(true);
      try {
        const pollsData = await pollService.getAll();
        setPolls(pollsData);
      } catch (error) {
        console.error('Failed to load polls:', error);
      } finally {
        setLoadingPolls(false);
      }
    };
    
    loadPolls();
    
    // Load videos for poll options
    const loadVideos = async () => {
      try {
        const videosData = await videoService.getAll();
        setAllVideos(videosData);
      } catch (error) {
        console.error('Failed to load videos:', error);
      }
    };
    
    loadVideos();
  }, []);


  // Models and Channels are stored in Supabase only, not in localStorage to avoid quota exceeded error

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const generateToken = () =>
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2));

  const parseRecipients = (input: string) =>
    input
      .split(/[\n,;]+/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

  const handleSendInviteEmail = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showSnackbar('Please enter inviter name and recipient email.', 'error');
      return;
    }

    setInviteSending(true);
    try {
      const inviteUrl = `${window.location.origin}/register?invite=${encodeURIComponent(
        inviteEmail.trim()
      )}&token=${generateToken()}`;
      await emailApi.sendInviteEmail({
        inviterName: inviteName.trim(),
        inviteeEmail: inviteEmail.trim(),
        inviteUrl,
      });
      showSnackbar('Invite email sent successfully!');
      setInviteEmail('');
    } catch (error) {
      console.error('Failed to send invite email:', error);
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to send invite email.',
        'error'
      );
    } finally {
      setInviteSending(false);
    }
  };

  const handleSendMarketingEmail = async () => {
    const recipients = parseRecipients(marketingRecipientsInput);
    if (!marketingSubject.trim() || !marketingHeadline.trim() || !marketingMessage.trim()) {
      showSnackbar('Please fill in subject, headline, and message.', 'error');
      return;
    }

    if (recipients.length === 0) {
      showSnackbar('Add at least one recipient email.', 'error');
      return;
    }

    setMarketingSending(true);
    try {
      await emailApi.sendMarketingEmail({
        subject: marketingSubject.trim(),
        headline: marketingHeadline.trim(),
        message: marketingMessage.trim(),
        recipients,
        ctaUrl: marketingCtaUrl.trim() || undefined,
        ctaLabel: marketingCtaLabel.trim() || undefined,
        unsubscribeUrl: marketingUnsubscribeUrl.trim() || undefined,
      });
      showSnackbar('Marketing campaign sent successfully!');
      setMarketingSubject('');
      setMarketingHeadline('');
      setMarketingMessage('');
      setMarketingRecipientsInput('');
      setMarketingCtaUrl('');
      setMarketingCtaLabel('');
      setMarketingUnsubscribeUrl('');
    } catch (error) {
      console.error('Failed to send marketing email:', error);
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to send marketing email.',
        'error'
      );
    } finally {
      setMarketingSending(false);
    }
  };

  // Category functions
  // Note: File upload removed - users should upload to imgbb manually and provide direct link

  const handleCategoryThumbnailUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setCategoryThumbnailUrl(url);
    if (url.trim()) {
      setCategoryThumbnailPreview(url.trim());
      setCategoryThumbnail(null); // Clear file when URL is entered
    } else {
      setCategoryThumbnailPreview(null);
    }
  };

  const handleRemoveCategoryThumbnail = () => {
    setCategoryThumbnail(null);
    setCategoryThumbnailPreview(null);
    setCategoryThumbnailUrl('');
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() && !categories.some(cat => cat.name === newCategory.trim())) {
      try {
        // Use URL if provided (imgbb direct link or any external URL)
        // No upload - user provides the URL directly from imgbb or other image hosting
        const thumbnailToUse = categoryThumbnailUrl.trim() || null;
        
        const newCategoryData = await categoryService.create({
          name: newCategory.trim(),
          thumbnail: thumbnailToUse,
        });
        
        setCategories([...categories, newCategoryData]);
        setNewCategory('');
        setCategoryThumbnail(null);
        setCategoryThumbnailPreview(null);
        setCategoryThumbnailUrl('');
        showSnackbar('Category added successfully!');
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        const errorCode = error?.code || 'N/A';
        showSnackbar(`Failed to add category (${errorCode}): ${errorMessage}`, 'error');
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
  const handleModelImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setModelImageUrl(url);
    if (url.trim()) {
      setModelImagePreview(url.trim());
    } else {
      setModelImagePreview(null);
    }
  };

  // Note: File upload removed - users should upload to imgbb manually and provide direct link

  const handleRemoveModelImage = () => {
    setModelImagePreview(null);
    setModelImageUrl('');
    setModelImageFile(null);
  };

  const handleFetchMetadata = async () => {
    if (!newModel.trim()) {
      showSnackbar('Please enter a model name first', 'error');
      return;
    }

    setMetadataLoading(true);
    setMetadataModalOpen(true);
    setScrapedMetadata(null);

    try {
      const metadata = await metadataApi.scrapeModelMetadata(newModel.trim());
      setScrapedMetadata(metadata);
      showSnackbar('Metadata fetched successfully!', 'success');
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to fetch metadata',
        'error'
      );
    } finally {
      setMetadataLoading(false);
    }
  };

  const handleUseMetadata = () => {
    if (!scrapedMetadata) return;

    // Auto-fill form with metadata
    if (scrapedMetadata.image) {
      setModelImageUrl(scrapedMetadata.image);
      setModelImagePreview(scrapedMetadata.image);
    }

    // Update model name
    if (scrapedMetadata.name) {
      setNewModel(scrapedMetadata.name);
    }

    // Switch to Models tab if not already there
    if (tabValue !== 1) {
      setTabValue(1);
    }

    setMetadataModalOpen(false);
    showSnackbar('Metadata applied to form! You can now add the model.', 'success');
  };

  const handleCloseMetadataModal = () => {
    setMetadataModalOpen(false);
    setScrapedMetadata(null);
  };

  const handleAddModel = async () => {
    if (newModel.trim() && !models.some(m => m.name === newModel.trim())) {
      try {
        // Use URL if provided (imgbb direct link or any external URL)
        // No upload - user provides the URL directly from imgbb or other image hosting
        const imageToUse = modelImageUrl.trim() || null;
        
        // First try to save to Supabase
        const createdModel = await modelService.create({
          name: newModel.trim(),
          image: imageToUse,
          is_trans: modelIsTrans
        });
        
        // If is_trans is true, save model ID to localStorage
        if (modelIsTrans && createdModel.id) {
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
        
        // Then update local state with Supabase response
        setModels([...models, createdModel]);
        setNewModel('');
        setModelImagePreview(null);
        setModelImageUrl('');
        setModelImageFile(null);
        setModelIsTrans(false);
        showSnackbar('Model added successfully to Supabase!');
      } catch (error: any) {
        // Log error details for debugging
        const errorMessage = error?.message || 'Unknown error';
        const errorCode = error?.code || 'N/A';
        
        console.error('❌ Model creation error:', error);
        console.error('   Error code:', errorCode);
        console.error('   Error status:', error?.status);
        console.error('   Error message:', errorMessage);
        
        // Handle specific error codes (23505 = unique constraint, 409 = conflict)
        if (errorCode === '23505' || error?.status === 409 || errorMessage?.includes('duplicate') || errorMessage?.includes('unique')) {
          // Unique constraint violation - model name already exists
          showSnackbar(`Model "${newModel.trim()}" already exists! Please use a different name.`, 'error');
          return; // Don't save to localStorage for duplicate names
        }
        
        // Fallback to local state only for other errors
        const imageToUse = modelImageUrl.trim() || null;
        const tempId = Date.now().toString();
        const newModelData: Model = {
          id: tempId,
          name: newModel.trim(),
          image: imageToUse,
          is_trans: modelIsTrans,
          created_at: new Date().toISOString()
        };
        
        // If is_trans is true, save model ID to localStorage
        if (modelIsTrans) {
          try {
            const transModels = JSON.parse(localStorage.getItem('transModels') || '[]');
            if (!transModels.includes(tempId)) {
              transModels.push(tempId);
              localStorage.setItem('transModels', JSON.stringify(transModels));
              console.log('✅ Saved trans model to localStorage (fallback):', tempId, newModel.trim());
            }
          } catch (e) {
            console.error('Failed to save trans model to localStorage:', e);
          }
        }
        
        setModels([...models, newModelData]);
        setNewModel('');
        setModelImagePreview(null);
        setModelImageUrl('');
        showSnackbar(`Model added locally (Supabase error: ${errorCode})`, 'warning');
      }
    } else if (models.some(m => m.name === newModel.trim())) {
      showSnackbar('Model already exists!', 'error');
    }
  };

  const handleEditModelImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setEditModelImageUrl(url);
    if (url.trim()) {
      setEditModelImagePreview(url.trim());
    } else {
      setEditModelImagePreview(null);
    }
  };

  const handleEditModel = (modelName: string) => {
    const model = models.find(m => m.name === modelName);
    setEditingModel(modelName);
    setEditModelValue(modelName);
    setEditModelImagePreview(model?.image || null);
    setEditModelImageUrl(model?.image || '');
    // Check if model is marked as trans in localStorage
    const transModelIds = JSON.parse(localStorage.getItem('transModels') || '[]');
    const isTrans = model?.id ? transModelIds.includes(model.id) : false;
    setEditModelIsTrans(isTrans);
  };

  const handleSaveModel = async () => {
    if (!editingModel) return;
    
    const model = models.find(m => m.name === editingModel);
    if (!model) return;

    const imageToUse = editModelImageUrl.trim() || model.image || null;

    try {
      // Update in Supabase
      const updatedModel = await modelService.update(model.id, {
        name: editModelValue.trim(),
        image: imageToUse
      });

      // Update trans status in localStorage
      const transModelIds = JSON.parse(localStorage.getItem('transModels') || '[]');
      if (editModelIsTrans) {
        // Add to trans models if not already there
        if (!transModelIds.includes(model.id)) {
          transModelIds.push(model.id);
          localStorage.setItem('transModels', JSON.stringify(transModelIds));
          console.log('✅ Saved trans model to localStorage:', model.id, editModelValue.trim());
        }
      } else {
        // Remove from trans models if it's there
        const index = transModelIds.indexOf(model.id);
        if (index > -1) {
          transModelIds.splice(index, 1);
          localStorage.setItem('transModels', JSON.stringify(transModelIds));
          console.log('✅ Removed trans model from localStorage:', model.id, editModelValue.trim());
        }
      }

      // Update local state with Supabase response
      const updatedModels = models.map(m => 
        m.id === model.id 
          ? { ...updatedModel, is_trans: editModelIsTrans }
          : m
      );
      setModels(updatedModels);
      setEditingModel(null);
      setEditModelValue('');
      setEditModelImagePreview(null);
      setEditModelImageUrl('');
      setEditModelIsTrans(false);
      showSnackbar('Model updated successfully in Supabase!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || 'N/A';
      showSnackbar(`Failed to update model in Supabase (${errorCode}): ${errorMessage}`, 'error');
    }
  };

  const handleCancelEditModel = () => {
    setEditingModel(null);
    setEditModelValue('');
    setEditModelImagePreview(null);
    setEditModelImageUrl('');
    setEditModelIsTrans(false);
  };

  const handleDeleteModel = async (modelName: string) => {
    const model = models.find(m => m.name === modelName);
    if (!model) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${modelName}"?`);
    if (!confirmDelete) return;

    try {
      // Delete from Supabase
      await modelService.delete(model.id);
      
      // Update local state
      setModels(models.filter(m => m.name !== modelName));
      showSnackbar('Model deleted successfully from Supabase!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || 'N/A';
      
      // Fallback: delete from local state only
      setModels(models.filter(m => m.name !== modelName));
      showSnackbar(`Model deleted locally (Supabase error: ${errorCode})`, 'warning');
    }
  };

  const handleDeleteModelOld = () => {
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





  // Channel functions
  // Note: File upload removed - users should upload to imgbb manually and provide direct link

  const handleChannelThumbnailUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setChannelThumbnailUrl(url);
    if (url.trim()) {
      setChannelThumbnailPreview(url.trim());
      setChannelThumbnail(null); // Clear file when URL is entered
    } else {
      setChannelThumbnailPreview(null);
    }
  };

  const handleRemoveChannelThumbnail = () => {
    setChannelThumbnail(null);
    setChannelThumbnailPreview(null);
    setChannelThumbnailUrl('');
  };

  const handleAddChannel = async () => {
    if (newChannel.trim() && !channels.some(c => c.name === newChannel.trim())) {
      try {
        // Use URL if provided (imgbb direct link or any external URL)
        // No upload - user provides the URL directly from imgbb or other image hosting
        const thumbnailToUse = channelThumbnailUrl.trim() || null;
        
        // First try to save to Supabase
        await channelService.create({
          name: newChannel.trim(),
          description: newChannelDescription,
          thumbnail: thumbnailToUse,
          banner: null
        });
        
        // Then update local state
        const newChannelData: Channel = {
          id: Date.now().toString(),
          name: newChannel.trim(),
          description: newChannelDescription,
          thumbnail: thumbnailToUse,
          banner: null,
          subscriber_count: 0,
          created_at: new Date().toISOString()
        };
        setChannels([...channels, newChannelData]);
        setNewChannel('');
        setNewChannelDescription('');
        setChannelThumbnail(null);
        setChannelThumbnailPreview(null);
        setChannelThumbnailUrl('');
        showSnackbar('Channel added successfully!');
      } catch (error) {
        console.error('Failed to save channel to Supabase:', error);
        // Fallback to local state only
        const thumbnailToUse = channelThumbnailUrl.trim() || channelThumbnailPreview;
        const newChannelData: Channel = {
          id: Date.now().toString(),
          name: newChannel.trim(),
          description: newChannelDescription,
          thumbnail: thumbnailToUse,
          banner: null,
          subscriber_count: 0,
          created_at: new Date().toISOString()
        };
        setChannels([...channels, newChannelData]);
        setNewChannel('');
        setNewChannelDescription('');
        setChannelThumbnail(null);
        setChannelThumbnailPreview(null);
        setChannelThumbnailUrl('');
        showSnackbar('Channel added successfully (local only)!');
      }
    } else if (channels.some(c => c.name === newChannel.trim())) {
      showSnackbar('Channel already exists!', 'error');
    }
  };

  const handleEditChannelThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Geçersiz resim dosyası');
        event.target.value = '';
        return;
      }
      setEditChannelThumbnail(file);
      setEditChannelThumbnailUrl('');
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditChannelThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditChannelThumbnailUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setEditChannelThumbnailUrl(url);
    if (url.trim()) {
      setEditChannelThumbnailPreview(url.trim());
      setEditChannelThumbnail(null);
    } else {
      setEditChannelThumbnailPreview(null);
    }
  };

  const handleEditChannel = (channelName: string) => {
    const channel = channels.find(c => c.name === channelName);
    setEditingChannel(channelName);
    setEditChannelValue(channelName);
    setEditChannelDescription(channel?.description || '');
    setEditChannelThumbnailPreview(channel?.thumbnail || null);
    setEditChannelThumbnailUrl(channel?.thumbnail || '');
    setEditChannelThumbnail(null);
  };

  const handleSaveChannel = async () => {
    if (!editingChannel) return;
    
    const channel = channels.find(c => c.name === editingChannel);
    if (!channel) return;

    const thumbnailToUse = editChannelThumbnailUrl.trim() || editChannelThumbnailPreview || channel.thumbnail;

    try {
      // Update in Supabase
      await channelService.update(channel.id, {
        name: editChannelValue.trim(),
        description: editChannelDescription,
        thumbnail: thumbnailToUse
      });

      // Update local state
      const updatedChannels = channels.map(c => 
        c.id === channel.id 
          ? { ...c, name: editChannelValue.trim(), description: editChannelDescription, thumbnail: thumbnailToUse }
          : c
      );
      setChannels(updatedChannels);
      setEditingChannel(null);
      setEditChannelValue('');
      setEditChannelDescription('');
      setEditChannelThumbnail(null);
      setEditChannelThumbnailPreview(null);
      setEditChannelThumbnailUrl('');
      showSnackbar('Channel updated successfully!');
    } catch (error) {
      console.error('Failed to update channel:', error);
      showSnackbar('Failed to update channel!', 'error');
    }
  };

  const handleCancelEditChannel = () => {
    setEditingChannel(null);
    setEditChannelValue('');
    setEditChannelDescription('');
    setEditChannelThumbnail(null);
    setEditChannelThumbnailPreview(null);
    setEditChannelThumbnailUrl('');
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab label="Categories" />
            <Tab label="Models" />
            <Tab label="Channels" />
            <Tab label="Users" />
            <Tab label="Email Automation" />
            <Tab label="Polls" />
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
                            // Silently handle image load error
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
                          Enter imgbb direct link or any image URL
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, fontSize: '0.75rem' }}>
                          💡 Upload your image to imgbb.com first, then paste the direct link here
                        </Typography>
                        <TextField
                          fullWidth
                          label="Thumbnail URL (imgbb direct link)"
                          placeholder="https://i.ibb.co/xxxxx/image.jpg"
                          value={categoryThumbnailUrl}
                          onChange={handleCategoryThumbnailUrlChange}
                            variant="outlined" 
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        {categoryThumbnailUrl.trim() && (
                          <Box sx={{ 
                            mt: 2, 
                            mb: 2,
                            p: 2,
                            border: '2px solid',
                            borderColor: 'primary.main',
                            borderRadius: 2,
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            minHeight: '150px',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Thumbnail Preview
                            </Typography>
                            <img
                              src={categoryThumbnailUrl.trim()}
                              alt="Preview"
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '200px', 
                                width: 'auto',
                                height: 'auto',
                                borderRadius: '8px',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                display: 'block'
                              }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const errorBox = target.parentElement?.querySelector('.preview-error');
                                if (errorBox) {
                                  (errorBox as HTMLElement).style.display = 'block';
                                }
                              }}
                              onLoad={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'block';
                                const errorBox = target.parentElement?.querySelector('.preview-error');
                                if (errorBox) {
                                  (errorBox as HTMLElement).style.display = 'none';
                                }
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              color="error.main" 
                              className="preview-error"
                              sx={{ display: 'none', mt: 1 }}
                            >
                              Failed to load image. Please check the URL.
                            </Typography>
                          </Box>
                        )}
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
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={handleFetchMetadata}
                    disabled={!newModel.trim() || metadataLoading}
                    sx={{ minWidth: 150 }}
                  >
                    {metadataLoading ? <CircularProgress size={20} /> : 'Fetch Metadata'}
                  </Button>
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
                            // Silently handle image load error
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
                          Enter imgbb direct link or any image URL
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, fontSize: '0.75rem' }}>
                          💡 Upload your image to imgbb.com first, then paste the direct link here
                        </Typography>
                        <TextField
                          fullWidth
                          label="Image URL (imgbb direct link)"
                          placeholder="https://i.ibb.co/xxxxx/image.jpg"
                          value={modelImageUrl}
                          onChange={handleModelImageUrlChange}
                          variant="outlined"
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                          <input
                            type="checkbox"
                            id="admin-trans-checkbox"
                            checked={modelIsTrans}
                            onChange={(e) => setModelIsTrans(e.target.checked)}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                          <label htmlFor="admin-trans-checkbox" style={{ cursor: 'pointer', color: 'inherit' }}>
                            Trans (Ts)
                          </label>
                        </Box>
                        {modelImageUrl.trim() && (
                          <Box sx={{ 
                            mt: 2, 
                            mb: 2,
                            p: 2,
                            border: '2px solid',
                            borderColor: 'primary.main',
                            borderRadius: 2,
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            minHeight: '200px',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Image Preview
                            </Typography>
                            <img
                              src={modelImageUrl.trim()}
                              alt="Preview"
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '300px', 
                                width: 'auto',
                                height: 'auto',
                                borderRadius: '8px',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                display: 'block'
                              }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const errorBox = target.parentElement?.querySelector('.preview-error');
                                if (errorBox) {
                                  (errorBox as HTMLElement).style.display = 'block';
                                }
                              }}
                              onLoad={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'block';
                                const errorBox = target.parentElement?.querySelector('.preview-error');
                                if (errorBox) {
                                  (errorBox as HTMLElement).style.display = 'none';
                                }
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              color="error.main" 
                              className="preview-error"
                              sx={{ display: 'none', mt: 1 }}
                            >
                              Failed to load image. Please check the URL.
                            </Typography>
                          </Box>
                        )}
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
                        {!editingModel && (
                          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1, zIndex: 10 }}>
                            <IconButton
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditModel(model.name);
                              }}
                              size="small"
                              sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModel(model.name);
                              }}
                              size="small"
                              sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'rgba(255,255,255,1)' } }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        )}
                        {editingModel === model.name ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                            <TextField
                              fullWidth
                              label="Model Name"
                              value={editModelValue}
                              onChange={(e) => setEditModelValue(e.target.value)}
                              size="small"
                              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>Model Image</Typography>
                              <TextField
                                fullWidth
                                label="Image URL (Optional)"
                                placeholder="Enter image URL"
                                value={editModelImageUrl}
                                onChange={handleEditModelImageUrlChange}
                                variant="outlined"
                                size="small"
                                sx={{ mb: 1 }}
                              />

                              {editModelImagePreview && (
                                <Box sx={{ mt: 1 }}>
                                  <img
                                    src={editModelImagePreview}
                                    alt="Preview"
                                    style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }}
                                  />
                                </Box>
                              )}
                            </Box>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={editModelIsTrans}
                                  onChange={(e) => setEditModelIsTrans(e.target.checked)}
                                  color="primary"
                                />
                              }
                              label="Trans (Ts)"
                              sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="contained"
                                startIcon={<Save />}
                                onClick={handleSaveModel}
                                size="small"
                                fullWidth
                              >
                                Save
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<Cancel />}
                                onClick={handleCancelEditModel}
                                size="small"
                                fullWidth
                              >
                                Cancel
                              </Button>
                            </Box>
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
                            Enter imgbb direct link or any image URL
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, fontSize: '0.75rem' }}>
                            💡 Upload your image to imgbb.com first, then paste the direct link here
                          </Typography>
                          <TextField
                            fullWidth
                            label="Thumbnail URL (imgbb direct link)"
                            placeholder="https://i.ibb.co/xxxxx/image.jpg"
                            value={channelThumbnailUrl}
                            onChange={handleChannelThumbnailUrlChange}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          {channelThumbnailUrl.trim() && (
                            <Box sx={{ 
                              mt: 2, 
                              mb: 2,
                              p: 2,
                              border: '2px solid',
                              borderColor: 'primary.main',
                              borderRadius: 2,
                              backgroundColor: 'rgba(0, 0, 0, 0.05)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                              minHeight: '150px',
                              justifyContent: 'center'
                            }}>
                              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Thumbnail Preview
                              </Typography>
                              <img
                                src={channelThumbnailUrl.trim()}
                                alt="Preview"
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '200px', 
                                  width: 'auto',
                                  height: 'auto',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(0, 0, 0, 0.1)',
                                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                  display: 'block'
                                }}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const errorBox = target.parentElement?.querySelector('.preview-error');
                                  if (errorBox) {
                                    (errorBox as HTMLElement).style.display = 'block';
                                  }
                                }}
                                onLoad={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'block';
                                  const errorBox = target.parentElement?.querySelector('.preview-error');
                                  if (errorBox) {
                                    (errorBox as HTMLElement).style.display = 'none';
                                  }
                                }}
                              />
                              <Typography 
                                variant="caption" 
                                color="error.main" 
                                className="preview-error"
                                sx={{ display: 'none', mt: 1 }}
                              >
                                Failed to load image. Please check the URL.
                              </Typography>
                            </Box>
                          )}
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
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
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
                              {user.email_verified ? (
                                <Chip
                                  icon={<CheckCircle />}
                                  label="Email Verified"
                                  size="small"
                                  color="success"
                                  sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}
                                />
                              ) : (
                                <Chip
                                  label="Email Not Verified"
                                  size="small"
                                  color="warning"
                                  sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)' }}
                                />
                              )}
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

        {/* Email Automation Tab Panel */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Email Automation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Trigger MailerSend flows for verification follow-ups, invitations, and marketing messages.
              </Typography>
            </Box>

            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Send Invitation</Typography>
                <Typography variant="body2" color="text.secondary">
                  Invite a creator or partner to join the platform. A unique invite link will be generated automatically.
                </Typography>
                <TextField
                  label="Inviter Name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Invitee Email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handleSendInviteEmail}
                  disabled={inviteSending}
                  sx={{ alignSelf: 'flex-start', minWidth: 180 }}
                >
                  {inviteSending ? 'Sending…' : 'Send Invite'}
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">Send Marketing Campaign</Typography>
                <Typography variant="body2" color="text.secondary">
                  Paste recipient emails separated by commas, semicolons, or new lines. MailerSend will deliver the campaign to each address.
                </Typography>
                <TextField
                  label="Recipients"
                  placeholder="example1@mail.com, example2@mail.com"
                  multiline
                  minRows={3}
                  value={marketingRecipientsInput}
                  onChange={(e) => setMarketingRecipientsInput(e.target.value)}
                  helperText="Comma, semicolon, or newline separated email addresses"
                />
                <TextField
                  label="Subject"
                  value={marketingSubject}
                  onChange={(e) => setMarketingSubject(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Headline"
                  value={marketingHeadline}
                  onChange={(e) => setMarketingHeadline(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Message"
                  value={marketingMessage}
                  onChange={(e) => setMarketingMessage(e.target.value)}
                  multiline
                  minRows={4}
                  fullWidth
                />
                <TextField
                  label="CTA URL (optional)"
                  value={marketingCtaUrl}
                  onChange={(e) => setMarketingCtaUrl(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="CTA Label (optional)"
                  value={marketingCtaLabel}
                  onChange={(e) => setMarketingCtaLabel(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Unsubscribe URL (optional)"
                  value={marketingUnsubscribeUrl}
                  onChange={(e) => setMarketingUnsubscribeUrl(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSendMarketingEmail}
                  disabled={marketingSending}
                  sx={{ alignSelf: 'flex-start', minWidth: 200 }}
                >
                  {marketingSending ? 'Sending campaign…' : 'Send Campaign'}
                </Button>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Card>

      {/* Metadata Preview Modal */}
      <Dialog
        open={metadataModalOpen}
        onClose={handleCloseMetadataModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Model Metadata Preview</Typography>
            <IconButton onClick={handleCloseMetadataModal} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {metadataLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Fetching metadata...
                </Typography>
              </Box>
            </Box>
          ) : scrapedMetadata ? (
            <Box>
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                {scrapedMetadata.image && (
                  <Box>
                    <img
                      src={scrapedMetadata.image}
                      alt={scrapedMetadata.name}
                      style={{
                        width: '200px',
                        height: '300px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </Box>
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" gutterBottom>
                    {scrapedMetadata.name}
                  </Typography>
                  {scrapedMetadata.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {scrapedMetadata.description}
                    </Typography>
                  )}
                  {scrapedMetadata.images && scrapedMetadata.images.length > 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Additional Images ({scrapedMetadata.images.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {scrapedMetadata.images.slice(1, 4).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`${scrapedMetadata.name} ${idx + 2}`}
                            style={{
                              width: '80px',
                              height: '120px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setModelImageUrl(img);
                              setModelImagePreview(img);
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Click "Use Metadata" to automatically fill the form with this information.
              </Alert>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No metadata found. Please try a different model name.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMetadataModal}>Cancel</Button>
          <Button
            onClick={handleUseMetadata}
            variant="contained"
            disabled={!scrapedMetadata}
          >
            Use Metadata
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Polls Tab Panel */}
      <TabPanel value={tabValue} index={5}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              Polls Management ({polls.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingPoll(null);
                setNewPollTitle('');
                setNewPollType('best_model');
                setNewPollDescription('');
                setPollOptions([]);
                setPollDialogOpen(true);
              }}
            >
              Create Poll
            </Button>
          </Box>

          {loadingPolls ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : polls.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No polls found. Create your first poll!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {polls.map((poll) => (
                <Card key={poll.id} sx={{ bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">{poll.title}</Typography>
                        <Chip 
                          label={poll.type.replace('_', ' ').toUpperCase()} 
                          size="small" 
                          sx={{ mt: 1, mr: 1 }}
                        />
                        <Chip 
                          label={poll.is_active ? 'Active' : 'Inactive'} 
                          size="small" 
                          color={poll.is_active ? 'success' : 'default'}
                          sx={{ mt: 1 }}
                        />
                        {poll.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {poll.description}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            try {
                              await pollService.update(poll.id, { is_active: !poll.is_active });
                              const updatedPolls = await pollService.getAll();
                              setPolls(updatedPolls);
                              showSnackbar(`Poll ${poll.is_active ? 'deactivated' : 'activated'} successfully`);
                            } catch (error) {
                              showSnackbar('Failed to update poll', 'error');
                            }
                          }}
                        >
                          {poll.is_active ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            try {
                              await pollService.delete(poll.id);
                              const updatedPolls = await pollService.getAll();
                              setPolls(updatedPolls);
                              showSnackbar('Poll deleted successfully');
                            } catch (error) {
                              showSnackbar('Failed to delete poll', 'error');
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Create/Edit Poll Dialog */}
      <Dialog open={pollDialogOpen} onClose={() => setPollDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPoll ? 'Edit Poll' : 'Create New Poll'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Poll Title"
              value={newPollTitle}
              onChange={(e) => setNewPollTitle(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Poll Type</InputLabel>
              <Select
                value={newPollType}
                onChange={(e) => {
                  setNewPollType(e.target.value as any);
                  // Set default options based on type
                  if (e.target.value === 'best_model') {
                    setPollOptions(models.map(m => ({ text: m.name, value: m.id })));
                  } else if (e.target.value === 'best_video') {
                    setPollOptions(allVideos.slice(0, 10).map(v => ({ text: v.title, value: v.id })));
                  } else if (e.target.value === 'content_preference') {
                    setPollOptions([
                      { text: 'Anal', value: 'anal' },
                      { text: 'Oral', value: 'oral' },
                      { text: 'Hardcore', value: 'hardcore' },
                      { text: 'Lesbian', value: 'lesbian' },
                      { text: 'Threesome', value: 'threesome' },
                      { text: 'Group', value: 'group' }
                    ]);
                  } else if (e.target.value === 'satisfaction') {
                    setPollOptions([
                      { text: 'Very Satisfied', value: 'very_satisfied' },
                      { text: 'Satisfied', value: 'satisfied' },
                      { text: 'Neutral', value: 'neutral' },
                      { text: 'Dissatisfied', value: 'dissatisfied' },
                      { text: 'Very Dissatisfied', value: 'very_dissatisfied' }
                    ]);
                  }
                }}
                label="Poll Type"
              >
                <MenuItem value="best_model">Best Model of the Month</MenuItem>
                <MenuItem value="best_video">Best Video of the Month</MenuItem>
                <MenuItem value="content_preference">What Type of Content Would You Like to Watch?</MenuItem>
                <MenuItem value="satisfaction">Are You Satisfied with the Content?</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description (Optional)"
              value={newPollDescription}
              onChange={(e) => setNewPollDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Poll Options</Typography>
              {pollOptions.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={option.text}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[index].text = e.target.value;
                      setPollOptions(updated);
                    }}
                    placeholder="Option text"
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setPollOptions(pollOptions.filter((_, i) => i !== index));
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => setPollOptions([...pollOptions, { text: '', value: '' }])}
              >
                Add Option
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPollDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!newPollTitle.trim() || pollOptions.length < 2) {
                showSnackbar('Please fill in all required fields and add at least 2 options', 'error');
                return;
              }
              try {
                const poll = await pollService.create({
                  title: newPollTitle,
                  type: newPollType,
                  description: newPollDescription || null,
                  is_active: true,
                  start_date: new Date().toISOString(),
                  end_date: null
                });
                
                await pollOptionService.createMultiple(
                  pollOptions.map((opt, idx) => ({
                    poll_id: poll.id,
                    option_text: opt.text,
                    option_value: opt.value || null,
                    display_order: idx
                  }))
                );
                
                const updatedPolls = await pollService.getAll();
                setPolls(updatedPolls);
                setPollDialogOpen(false);
                showSnackbar('Poll created successfully');
              } catch (error: any) {
                console.error('Failed to create poll:', error);
                const errorMessage = error?.message || error?.code || 'Unknown error';
                showSnackbar(`Failed to create poll: ${errorMessage}`, 'error');
              }
            }}
          >
            {editingPoll ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Admin;
