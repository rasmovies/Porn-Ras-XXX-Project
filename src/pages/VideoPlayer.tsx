import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Chip,
  Divider,
  Alert,
  ToggleButton,
  TextField,
  Avatar,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Share,
  Favorite,
  FavoriteBorder,
  Facebook,
  Twitter,
  Instagram,
  WhatsApp,
  Reddit,
} from '@mui/icons-material';
import { motion } from 'motion/react';
import { videoService, commentService } from '../services/database';
import { Video, Comment } from '../lib/supabase';
import SEO from '../components/SEO/SEO';

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeStatus, setLikeStatus] = useState<'liked' | 'disliked' | 'none'>('none');
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [commentLikes, setCommentLikes] = useState<Set<string>>(new Set());
  const [commentDislikes, setCommentDislikes] = useState<Set<string>>(new Set());

  // Load video data from Supabase
  useEffect(() => {
    const loadVideoData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Try to load from Supabase first
        const supabaseVideo = await videoService.getBySlug(id);
        if (supabaseVideo) {
          setVideo(supabaseVideo);
          setLikeCount(supabaseVideo.likes);
          setDislikeCount(supabaseVideo.dislikes);
          
          // Load comments from Supabase
          const supabaseComments = await commentService.getByVideoId(supabaseVideo.id);
          // Ensure comments are in correct format
          const formattedComments = supabaseComments.map((comment: any): Comment => ({
            id: comment.id,
            video_id: comment.video_id,
            author: comment.author,
            content: comment.content,
            likes: comment.likes || 0,
            dislikes: comment.dislikes || 0,
            created_at: comment.created_at
          }));
          setComments(formattedComments);
          
          // Load user's like/dislike status from localStorage
          const savedLikes = JSON.parse(localStorage.getItem(`commentLikes_${supabaseVideo.id}`) || '[]');
          const savedDislikes = JSON.parse(localStorage.getItem(`commentDislikes_${supabaseVideo.id}`) || '[]');
          setCommentLikes(new Set(savedLikes));
          setCommentDislikes(new Set(savedDislikes));
        } else {
          // Fallback to localStorage
          const videos = JSON.parse(localStorage.getItem('videos') || '[]');
          const foundVideo = videos.find((v: any) => v.slug === id);
          
          if (foundVideo) {
            setVideo(foundVideo);
            setLikeCount(foundVideo.likes || 0);
            setDislikeCount(foundVideo.dislikes || 0);
            
            // Load comments from localStorage
            const savedComments = JSON.parse(localStorage.getItem(`comments_${foundVideo.id}`) || '[]');
            // Convert localStorage comments to Comment type
            const convertedComments: Comment[] = savedComments.map((comment: any) => ({
              id: comment.id,
              video_id: foundVideo.id,
              author: comment.author,
              content: comment.text || comment.content,
              likes: comment.likes || 0,
              dislikes: comment.dislikes || 0,
              created_at: comment.timestamp || comment.created_at || new Date().toISOString()
            }));
            setComments(convertedComments);
            
            // Load user's like/dislike status from localStorage
            const savedLikes = JSON.parse(localStorage.getItem(`commentLikes_${foundVideo.id}`) || '[]');
            const savedDislikes = JSON.parse(localStorage.getItem(`commentDislikes_${foundVideo.id}`) || '[]');
            setCommentLikes(new Set(savedLikes));
            setCommentDislikes(new Set(savedDislikes));
          } else {
            // Fallback to mock data for demo
            const mockVideo: Video = {
              id: id || '1',
              title: 'Amazing Video Title',
              description: 'This is an amazing video with incredible content that will blow your mind!',
              thumbnail: 'https://via.placeholder.com/800x450/ff6b6b/ffffff?text=Video+Thumbnail',
              streamtape_url: 'https://streamtape.com/e/d8zaQvywMbckVpK/',
              duration: '10:30',
              category_id: null,
              model_id: null,
              channel_id: null,
              views: 1234567,
              likes: 45678,
              dislikes: 1234,
              created_at: '2024-01-15T00:00:00Z',
              slug: id || 'amazing-video-title'
            };
            setVideo(mockVideo);
            setLikeCount(mockVideo.likes || 0);
            setDislikeCount(mockVideo.dislikes || 0);
          }
        }
      } catch (err) {
        console.error('Failed to load video:', err);
        setError('Failed to load video data');
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [id]);

  const handleLikeToggle = () => {
    if (likeStatus === 'liked') {
      // Remove like
      setLikeStatus('none');
      setLikeCount(prev => Math.max(0, prev - 1));
    } else {
      // Add like, remove dislike if exists
      setLikeStatus('liked');
      setLikeCount(prev => prev + 1);
      if (likeStatus === 'disliked') {
        setDislikeCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleDislikeToggle = () => {
    if (likeStatus === 'disliked') {
      // Remove dislike
      setLikeStatus('none');
      setDislikeCount(prev => Math.max(0, prev - 1));
    } else {
      // Add dislike, remove like if exists
      setLikeStatus('disliked');
      setDislikeCount(prev => prev + 1);
      if (likeStatus === 'liked') {
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleShareMenuToggle = () => {
    setShareMenuOpen(!shareMenuOpen);
  };

  const handleSocialShare = (platform: string) => {
    const videoUrl = window.location.href;
    const videoTitle = video?.title || 'Check out this video!';
    const shareText = `${videoTitle} - ${videoUrl}`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(videoTitle)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, copy to clipboard
        navigator.clipboard.writeText(videoUrl);
        alert('Video URL copied to clipboard!');
        return;
      case 'github':
        shareUrl = `https://github.com/`;
        break;
      case 'youtube':
        shareUrl = `https://www.youtube.com/`;
        break;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !commentAuthor.trim()) {
      alert('Please enter both your name and comment');
      return;
    }

    if (!video) {
      alert('Video not found');
      return;
    }

    try {
      // Create comment data for Supabase
      const commentData = {
        video_id: video.id,
        author: commentAuthor,
        content: newComment
      };

      // Save to Supabase
      const savedComment = await commentService.create(commentData);

      // Also save to localStorage for backward compatibility
      const localStorageComment: Comment = {
        id: savedComment.id,
        video_id: video.id,
        author: commentAuthor,
        content: newComment,
        likes: 0,
        dislikes: 0,
        created_at: new Date().toISOString()
      };

      setComments(prev => [localStorageComment, ...prev]);
      setNewComment('');
      setCommentAuthor('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!video?.id) return;
    
    try {
      // Check if user already liked this comment
      if (commentLikes.has(commentId)) {
        // Remove like
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
          await commentService.update(commentId, { likes: Math.max(0, comment.likes - 1) });
        }
        
        // Update local state
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: Math.max(0, comment.likes - 1) }
            : comment
        ));
        
        // Remove from likes set
        const newLikes = new Set(commentLikes);
        newLikes.delete(commentId);
        setCommentLikes(newLikes);
        
        // Save to localStorage
        localStorage.setItem(`commentLikes_${video.id}`, JSON.stringify(Array.from(newLikes)));
        
      } else {
        // Add like, remove dislike if exists
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
          await commentService.update(commentId, { likes: comment.likes + 1 });
        }
        
        // Update local state
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes + 1 }
            : comment
        ));
        
        // Add to likes set, remove from dislikes if exists
        const newLikes = new Set(commentLikes);
        newLikes.add(commentId);
        setCommentLikes(newLikes);
        
        const newDislikes = new Set(commentDislikes);
        newDislikes.delete(commentId);
        setCommentDislikes(newDislikes);
        
        // Save to localStorage
        localStorage.setItem(`commentLikes_${video.id}`, JSON.stringify(Array.from(newLikes)));
        localStorage.setItem(`commentDislikes_${video.id}`, JSON.stringify(Array.from(newDislikes)));
      }
      
    } catch (error) {
      console.error('Failed to update comment like:', error);
      alert('Failed to like comment. Please try again.');
    }
  };

  const handleCommentDislike = async (commentId: string) => {
    if (!video?.id) return;
    
    try {
      // Check if user already disliked this comment
      if (commentDislikes.has(commentId)) {
        // Remove dislike (increase likes back)
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
          await commentService.update(commentId, { likes: comment.likes + 1 });
        }
        
        // Update local state
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes + 1 }
            : comment
        ));
        
        // Remove from dislikes set
        const newDislikes = new Set(commentDislikes);
        newDislikes.delete(commentId);
        setCommentDislikes(newDislikes);
        
        // Save to localStorage
        localStorage.setItem(`commentDislikes_${video.id}`, JSON.stringify(Array.from(newDislikes)));
        
      } else {
        // Add dislike, remove like if exists
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
          await commentService.update(commentId, { 
            likes: Math.max(0, comment.likes - 1),
            dislikes: (comment.dislikes || 0) + 1
          });
        }
        
        // Update local state
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes: Math.max(0, comment.likes - 1),
                dislikes: (comment.dislikes || 0) + 1
              }
            : comment
        ));
        
        // Add to dislikes set, remove from likes if exists
        const newDislikes = new Set(commentDislikes);
        newDislikes.add(commentId);
        setCommentDislikes(newDislikes);
        
        const newLikes = new Set(commentLikes);
        newLikes.delete(commentId);
        setCommentLikes(newLikes);
        
        // Save to localStorage
        localStorage.setItem(`commentDislikes_${video.id}`, JSON.stringify(Array.from(newDislikes)));
        localStorage.setItem(`commentLikes_${video.id}`, JSON.stringify(Array.from(newLikes)));
      }
      
    } catch (error) {
      console.error('Failed to update comment dislike:', error);
      alert('Failed to dislike comment. Please try again.');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Typography variant="h6">Loading video...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !video) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
        <Alert severity="error">
          {error || 'Video not found'}
        </Alert>
      </Container>
    );
  }

  const shareMenu = (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <IconButton
          onClick={handleShareMenuToggle}
          sx={{
            width: '56px',
            height: '56px',
            backgroundColor: '#fff',
            color: '#333',
            fontSize: '2rem',
            boxShadow: '0 3px 4px rgba(0, 0, 0, 0.15)',
            border: '2px solid #333',
            '&:hover': {
              backgroundColor: '#fff',
              boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15), 0 0 0 2px #333, 0 0 0 8px #fff',
            },
            transform: shareMenuOpen ? 'rotate(360deg)' : 'rotate(0deg)',
            transition: 'transform 1.25s ease',
          }}
        >
          <Share />
        </IconButton>
      </motion.div>

      {shareMenuOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={handleShareMenuToggle}
        />
      )}

      <Box
        sx={{
          position: 'absolute',
          width: 260,
          height: 260,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          pointerEvents: shareMenuOpen ? 'auto' : 'none',
        }}
      >
        {[
          { platform: 'facebook', icon: <Facebook />, color: '#1877f2', index: 0 },
          { platform: 'whatsapp', icon: <WhatsApp />, color: '#25d366', index: 1 },
          { platform: 'twitter', icon: <Twitter />, color: '#1b1e21', index: 2 },
          { platform: 'reddit', icon: <Reddit />, color: '#ff5733', index: 3 },
          { platform: 'instagram', icon: <Instagram />, color: '#c32aa3', index: 4 },
        ].map((social) => {
          const angle = (360 / 5) * social.index;
          const radius = 120;
          const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius;
          const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius;

          return (
            <motion.div
              key={social.platform}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: shareMenuOpen ? 1 : 0,
                x: shareMenuOpen ? x : 0,
                y: shareMenuOpen ? y : 0,
              }}
              transition={{
                delay: shareMenuOpen ? social.index * 0.05 : 0,
                duration: 0.5,
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                <IconButton
                  onClick={() => handleSocialShare(social.platform)}
                  sx={{
                    width: '54px',
                    height: '54px',
                    backgroundColor: '#fff',
                    color: social.color,
                    fontSize: '1.75rem',
                    boxShadow: '0 3px 4px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      fontSize: '2.4rem',
                      boxShadow: `0 0 0 2px ${social.color}, 0 0 0 6px #fff`,
                      backgroundColor: '#fff',
                    },
                  }}
                >
                  {social.icon}
                </IconButton>
              </motion.div>
            </motion.div>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <>
      <SEO
        title={video.title}
        description={video.description || `${video.title} videosu`}
        image={video.thumbnail || '/PORNRAS.png'}
        url={`/video/${video.slug || video.id}`}
        type="video.other"
        keywords={`${video.title}, pornras, video`}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Box sx={{ mb: 3 }}>
            {/* Streamtape Player */}
            <Box
              sx={{
                width: '100%',
                position: 'relative',
                paddingTop: '56.25%', // 16:9 aspect ratio
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                mb: 3,
              }}
            >
              <iframe
                src={video.streamtape_url || 'https://streamtape.com/e/d8zaQvywMbckVpK/'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                  backgroundColor: '#000'
                }}
                allowFullScreen
                allowTransparency
                allow="autoplay"
                scrolling="no"
                frameBorder="0"
                title={`${video.title} oynatıcı`}
              />
            </Box>
          </Box>
        </motion.div>

        {/* Video Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-start' }, gap: { xs: 2, md: 0 } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {video.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  {video.views?.toLocaleString() || '0'} views
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'Unknown date'}
                </Typography>
                <Chip label="Video" size="small" color="primary" />
              </Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {video.description}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Modern Like/Dislike Toggle Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ToggleButton
                    value="like"
                    selected={likeStatus === 'liked'}
                    onChange={handleLikeToggle}
                    sx={{
                      border: '2px solid',
                      borderColor: likeStatus === 'liked' ? '#ff6b6b' : 'rgba(255, 255, 255, 0.23)',
                      backgroundColor: likeStatus === 'liked' ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                      color: likeStatus === 'liked' ? '#ff6b6b' : 'inherit',
                      borderRadius: '25px',
                      px: 2,
                      py: 1,
                      minWidth: '80px',
                      '&:hover': {
                        backgroundColor: likeStatus === 'liked' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        borderColor: likeStatus === 'liked' ? '#ff6b6b' : 'rgba(255, 255, 255, 0.4)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        color: '#ff6b6b',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 107, 107, 0.2)',
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {likeStatus === 'liked' ? (
                        <Favorite sx={{ fontSize: 20 }} />
                      ) : (
                        <FavoriteBorder sx={{ fontSize: 20 }} />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {likeCount.toLocaleString()}
                      </Typography>
                    </Box>
                  </ToggleButton>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ToggleButton
                    value="dislike"
                    selected={likeStatus === 'disliked'}
                    onChange={handleDislikeToggle}
                    sx={{
                      border: '2px solid',
                      borderColor: likeStatus === 'disliked' ? '#ff6b6b' : 'rgba(255, 255, 255, 0.23)',
                      backgroundColor: likeStatus === 'disliked' ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                      color: likeStatus === 'disliked' ? '#ff6b6b' : 'inherit',
                      borderRadius: '25px',
                      px: 2,
                      py: 1,
                      minWidth: '80px',
                      '&:hover': {
                        backgroundColor: likeStatus === 'disliked' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        borderColor: likeStatus === 'disliked' ? '#ff6b6b' : 'rgba(255, 255, 255, 0.4)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        color: '#ff6b6b',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 107, 107, 0.2)',
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ThumbDown sx={{ 
                        fontSize: 20,
                        transform: likeStatus === 'disliked' ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {dislikeCount.toLocaleString()}
                      </Typography>
                    </Box>
                  </ToggleButton>
                </motion.div>
              </Box>

              {/* Magic Social Share Menu */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>{shareMenu}</Box>
            </Box>
          </Box>
        </motion.div>

        <Divider sx={{ my: 3 }} />

        {/* Tags and Actors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['video', 'content', 'entertainment'].map((tag: string, index: number) => (
                <Chip
                  key={index}
                  label={tag}
                  variant="outlined"
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

        </motion.div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        >
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between', 
              mb: 4,
              p: { xs: 2, md: 3 },
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              gap: { xs: 2, md: 0 },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: { xs: 40, md: 50 },
                  height: { xs: 40, md: 50 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)',
                }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    💬
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5,
                    fontSize: { xs: '1.25rem', md: '2rem' }
                  }}>
                    Comments
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                  </Typography>
                </Box>
              </Box>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setShowComments(!showComments)}
                  sx={{ 
                    borderRadius: '25px',
                    px: 3,
                    py: 1.5,
                    border: '2px solid rgba(255, 107, 107, 0.3)',
                    color: 'primary.main',
                    fontWeight: 'bold',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(78, 205, 196, 0.1))',
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.2)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {showComments ? '👁️ Hide' : '👁️ Show'} Comments
                </Button>
              </motion.div>
            </Box>

            {showComments && (
              <>
                {/* Add Comment Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card sx={{ 
                    mb: 4, 
                    p: { xs: 2, md: 3 },
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Box sx={{
                        width: { xs: 35, md: 40 },
                        height: { xs: 35, md: 40 },
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Typography variant="h6" sx={{ color: 'white', fontSize: { xs: '0.875rem', md: '1.25rem' } }}>
                          ✍️
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '1rem', md: '1.25rem' }
                      }}>
                        Share Your Thoughts
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Your Name"
                        placeholder="Enter your name..."
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 107, 107, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#ff6b6b',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'text.secondary',
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Comment"
                        placeholder="Share your thoughts about this video..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        multiline
                        rows={4}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 107, 107, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#ff6b6b',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'text.secondary',
                          },
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="contained"
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || !commentAuthor.trim()}
                            sx={{ 
                              borderRadius: '25px',
                              px: 4,
                              py: 1.5,
                              background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                              boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #ff5252, #26a69a)',
                                boxShadow: '0 12px 35px rgba(255, 107, 107, 0.4)',
                                transform: 'translateY(-2px)',
                              },
                              '&:disabled': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'text.secondary',
                              },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            🚀 Post Comment
                          </Button>
                        </motion.div>
                      </Box>
                    </Box>
                  </Card>
                </motion.div>

                {/* Comments List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {comments.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      }}>
                        <Box sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(78, 205, 196, 0.1))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 20px',
                          border: '2px solid rgba(255, 107, 107, 0.2)',
                        }}>
                          <Typography variant="h3">
                            💭
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ 
                          mb: 1,
                          background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontWeight: 'bold',
                        }}>
                          No comments yet
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Be the first to share your thoughts about this video! 🚀
                        </Typography>
                      </Card>
                    </motion.div>
                  ) : (
                    comments.map((comment, index) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: index * 0.1,
                          ease: "easeOut"
                        }}
                      >
                        <Card sx={{ 
                          p: 3,
                          background: 'rgba(255, 255, 255, 0.03)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '20px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.05)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                          },
                          transition: 'all 0.3s ease',
                        }}>
                          <Box sx={{ display: 'flex', gap: 3 }}>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Avatar sx={{ 
                                width: 50, 
                                height: 50,
                                background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                              }}>
                                {comment.author.charAt(0).toUpperCase()}
                              </Avatar>
                            </motion.div>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 'bold',
                                  background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }}>
                                  {comment.author}
                                </Typography>
                                <Box sx={{
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: '15px',
                                  background: 'rgba(255, 107, 107, 0.1)',
                                  border: '1px solid rgba(255, 107, 107, 0.2)',
                                }}>
                                  <Typography variant="caption" sx={{ 
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                  }}>
                                    {formatTimeAgo(comment.created_at)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="body1" sx={{ 
                                mb: 3,
                                lineHeight: 1.6,
                                color: 'text.primary',
                              }}>
                                {comment.content}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="small"
                                    startIcon={<ThumbUp />}
                                    onClick={() => handleCommentLike(comment.id)}
                                    disabled={false}
                                    sx={{ 
                                      borderRadius: '20px',
                                      px: 2,
                                      py: 1,
                                      background: commentLikes.has(comment.id) 
                                        ? 'rgba(76, 175, 80, 0.2)' 
                                        : 'rgba(255, 107, 107, 0.1)',
                                      border: commentLikes.has(comment.id) 
                                        ? '1px solid rgba(76, 175, 80, 0.5)' 
                                        : '1px solid rgba(255, 107, 107, 0.2)',
                                      color: commentLikes.has(comment.id) 
                                        ? 'success.main' 
                                        : 'primary.main',
                                      fontWeight: 'bold',
                                      '&:hover': { 
                                        background: commentLikes.has(comment.id) 
                                          ? 'rgba(76, 175, 80, 0.3)' 
                                          : 'rgba(255, 107, 107, 0.2)',
                                        transform: 'translateY(-1px)',
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    👍 {comment.likes}
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="small"
                                    startIcon={<ThumbDown />}
                                    onClick={() => handleCommentDislike(comment.id)}
                                    disabled={false}
                                    sx={{ 
                                      borderRadius: '20px',
                                      px: 2,
                                      py: 1,
                                      background: commentDislikes.has(comment.id) 
                                        ? 'rgba(244, 67, 54, 0.2)' 
                                        : 'rgba(255, 255, 255, 0.05)',
                                      border: commentDislikes.has(comment.id) 
                                        ? '1px solid rgba(244, 67, 54, 0.5)' 
                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                      color: commentDislikes.has(comment.id) 
                                        ? 'error.main' 
                                        : 'text.secondary',
                                      fontWeight: 'bold',
                                      '&:hover': { 
                                        background: commentDislikes.has(comment.id) 
                                          ? 'rgba(244, 67, 54, 0.3)' 
                                          : 'rgba(255, 255, 255, 0.1)',
                                        color: commentDislikes.has(comment.id) 
                                          ? 'error.main' 
                                          : 'error.main',
                                        transform: 'translateY(-1px)',
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    👎 {comment.dislikes || 0}
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="small"
                                    onClick={() => alert('Reply functionality coming soon!')}
                                    sx={{ 
                                      borderRadius: '20px',
                                      px: 2,
                                      py: 1,
                                      background: 'rgba(78, 205, 196, 0.1)',
                                      border: '1px solid rgba(78, 205, 196, 0.2)',
                                      color: 'secondary.main',
                                      fontWeight: 'bold',
                                      '&:hover': { 
                                        background: 'rgba(78, 205, 196, 0.2)',
                                        transform: 'translateY(-1px)',
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    💬 Reply
                                  </Button>
                                </motion.div>
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </Box>
              </>
            )}
          </Box>
        </motion.div>

        {/* Related Videos */}
        <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Related Videos
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((videoId) => (
            <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, mb: 2 }} key={videoId}>
              <Card sx={{ cursor: 'pointer' }}>
                <CardMedia
                  component="img"
                  height="120"
                  image={`https://via.placeholder.com/300x120/ff6b6b/ffffff?text=Related+${videoId}`}
                  alt={`Related video ${videoId}`}
                />
                <CardContent>
                  <Typography variant="subtitle2" noWrap>
                    Related Video {videoId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    123K views • 1 day ago
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default VideoPlayer;
