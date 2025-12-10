import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Badge,
  Popover,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Search,
  Upload,
  Person,
  Login,
  Logout,
  AdminPanelSettings,
  People,
  VideoLibrary,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../Auth/AuthProvider';
import { adminUserService, notificationService, modelService, channelService } from '../../services/database';
import { Model, Channel } from '../../lib/supabase';
import Footer from '../Footer/Footer';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, openLoginModal } = useAuth();
  
  // window.open'ın gerçek orijinal halini sakla (component mount olduğunda bir kez)
  const originalWindowOpenRef = useRef<typeof window.open | null>(null);
  const isBlockingAdsterraRef = useRef<boolean>(false);
  
  // Component mount olduğunda window.open'ın orijinal halini sakla
  useEffect(() => {
    if (!originalWindowOpenRef.current) {
      // window.open'ın gerçek orijinal halini sakla (eğer henüz override edilmediyse)
      // Native window.open'ı saklamak için descriptor kullan
      const descriptor = Object.getOwnPropertyDescriptor(window, 'open');
      if (descriptor && descriptor.value) {
        originalWindowOpenRef.current = descriptor.value.bind(window);
      } else {
        originalWindowOpenRef.current = window.open.bind(window);
      }
    }
  }, []);
  
  // Adsterra popunder - Admin ve Upload sayfaları hariç
  // Not: Adsterra script'i artık HTML dosyalarında direkt olarak yükleniyor
  // Bu component'te Admin/Upload sayfalarında script'i devre dışı bırakıyoruz
  useEffect(() => {
    const isAdminPage = location.pathname === '/admin';
    const isUploadPage = location.pathname === '/upload';
    
    if (isAdminPage || isUploadPage) {
      // Admin ve Upload sayfalarında Adsterra popunder'larını engelle
      isBlockingAdsterraRef.current = true;
      
      // window.open'ı override et (popunder'lar genellikle bunu kullanır)
      if (originalWindowOpenRef.current) {
        window.open = function(...args) {
          // Admin/Upload sayfalarında popup'ları engelle
          return null;
        };
      }
      
      // Cleanup function
      return () => {
        isBlockingAdsterraRef.current = false;
        // window.open'ı orijinal haline geri yükle
        if (originalWindowOpenRef.current) {
          window.open = originalWindowOpenRef.current;
        }
      };
    } else {
      // Diğer sayfalarda window.open'ın orijinal haline döndüğünden emin ol
      isBlockingAdsterraRef.current = false;
      if (originalWindowOpenRef.current) {
        window.open = originalWindowOpenRef.current;
      }
      
      // Adsterra script'inin çalışması için gerekli olan şeyleri kontrol et
      // Script'in yüklendiğinden emin ol
      const adsterraScript = document.querySelector('script[src*="skybaggycollecting.com"]') as HTMLScriptElement;
      if (!adsterraScript) {
        // Script yüklenmemişse, yeniden yükle
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//skybaggycollecting.com/26/fc/1b/26fc1b5a649c7a1c9f4e9be462e02070.js';
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, [location.pathname]);

  // Load models and channels for navigation
  useEffect(() => {
    const loadModelsAndChannels = async () => {
      try {
        console.log('🔍 Layout: Loading models and channels...');
        const [modelsData, channelsData] = await Promise.all([
          modelService.getAll(),
          channelService.getAll()
        ]);
        console.log('✅ Layout: Models loaded:', modelsData.length);
        console.log('✅ Layout: Channels loaded:', channelsData.length);
        setModels(modelsData);
        setChannels(channelsData);
      } catch (error: any) {
        console.error('❌ Layout: Failed to load models and channels:', error);
        console.error('   Error details:', {
          message: error.message,
          code: error.code
        });
        // Set empty arrays on error
        setModels([]);
        setChannels([]);
      }
    };
    
    loadModelsAndChannels();
  }, []);

  // Check if user is admin from Supabase and load notifications
  useEffect(() => {
    const loadData = async () => {
      if (user?.username) {
        console.log('🔍 Layout: Checking admin status for user:', user.username);
        console.log('🔍 Layout: Full user object:', JSON.stringify(user, null, 2));
        try {
          const adminStatus = await adminUserService.isAdmin(user.username);
          console.log('🔍 Layout: Admin status result:', adminStatus);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('❌ Layout: Admin check failed:', error);
          setIsAdmin(false);
        }
        
        // Load notifications
        try {
          const userNotifications = await notificationService.getByUserId(user.username);
          setNotifications(userNotifications);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      } else {
        console.log('⚠️ Layout: No user.username found, setting isAdmin to false');
        console.log('   User object:', user);
        setIsAdmin(false);
      }
    };
    
    loadData();
  }, [user?.username]);

  // Create menu items
  const baseMenuItems = isAuthenticated
    ? [
        { text: 'Home', icon: <Home />, path: '/' },
        { text: 'Search', icon: <Search />, path: '/search' },
        ...(isAdmin ? [{ text: 'Upload', icon: <Upload />, path: '/upload' }] : []),
        { text: 'Categories', icon: <VideoLibrary />, path: '/categories' },
        { text: 'Models', icon: <People />, path: '/models' },
        { text: 'Channels', icon: <VideoLibrary />, path: '/channels' },
        ...(isAdmin ? [{ text: 'Admin', icon: <AdminPanelSettings />, path: '/admin' }] : []),
        { text: 'Profile', icon: <Person />, path: '/profile' },
        { text: 'Logout', icon: <Logout />, path: '/logout', isLogout: true },
      ]
    : [
        { text: 'Home', icon: <Home />, path: '/' },
        { text: 'Search', icon: <Search />, path: '/search' },
        { text: 'Categories', icon: <VideoLibrary />, path: '/categories' },
        { text: 'Models', icon: <People />, path: '/models' },
        { text: 'Channels', icon: <VideoLibrary />, path: '/channels' },
        { text: 'Login', icon: <Login />, path: '/login' },
      ];

  const menuItems = baseMenuItems;

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const handleMenuClick = (item: any) => {
    if ((item as any).isLogout) {
      // Handle logout
      logout();
      navigate('/');
      setMobileOpen(false);
    } else if (item.path === '/login') {
      openLoginModal();
      setMobileOpen(false);
    } else {
      navigate(item.path);
      setMobileOpen(false);
    }
  };

  const renderedChildren = children ?? <Outlet />;

  return (
    <Box sx={{ display: 'flex' }}>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Box
                component="img"
                src="/PORNRAS.png"
                alt="PORNRAS Logo"
                onClick={() => navigate('/')}
                sx={{
                  cursor: 'pointer',
                  height: '40px',
                  width: 'auto',
                  maxWidth: '200px',
                  objectFit: 'contain',
                }}
              />
            </motion.div>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: { xs: 'none', sm: 'none', md: 'flex' } }}>
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Button
                    color="inherit"
                    onClick={() => handleMenuClick(item)}
                  >
                    {item.text}
                  </Button>
                </motion.div>
              ))}
            </Box>
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            {isAuthenticated && (
              <>
                <IconButton color="inherit" onClick={handleNotificationClick}>
                  <Badge badgeContent={notifications.filter(n => !n.is_read).length} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                <Popover
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={handleNotificationClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <Box sx={{ width: 350, maxHeight: 500, overflow: 'auto', p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Notifications ({notifications.filter(n => !n.is_read).length} unread)
                    </Typography>
                    {notifications.length === 0 ? (
                      <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                        No notifications
                      </Typography>
                    ) : (
                      notifications.map((notification, index) => (
                        <Box
                          key={index}
                          onClick={async () => {
                            try {
                              await notificationService.markAsRead(notification.id);
                              setNotifications(notifications.map(n =>
                                n.id === notification.id ? { ...n, is_read: true } : n
                              ));

                              if (notification.type === 'video') {
                                const match = notification.message.match(/^(.+?)\s+uploaded a new video\.$/);
                                if (match) {
                                  const name = match[1].trim();
                                  const model = models.find(m => m.name.toLowerCase() === name.toLowerCase());
                                  if (model) {
                                    navigate(`/models/${model.name.toLowerCase().replace(/\s+/g, '-')}`);
                                    return;
                                  }
                                  const channel = channels.find(c => c.name.toLowerCase() === name.toLowerCase());
                                  if (channel) {
                                    navigate(`/channels/${channel.name.toLowerCase().replace(/\s+/g, '-')}`);
                                    return;
                                  }
                                }
                              }
                            } catch (err) {
                              console.error('Failed to mark notification as read:', err);
                            }
                          }}
                          sx={{
                            p: 2,
                            mb: 1,
                            borderRadius: 1,
                            cursor: 'pointer',
                            bgcolor: notification.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(255,107,107,0.1)',
                            border: notification.is_read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,107,107,0.3)',
                            '&:hover': {
                              bgcolor: notification.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(255,107,107,0.15)',
                            },
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}>
                            {notification.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {new Date(notification.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                </Popover>
              </>
            )}
          </Toolbar>
        </AppBar>
      </motion.div>

      {/* Mobile Menu Drawer */}
      <Box
        className="mobile-nav-overlay"
        sx={{
          display: { xs: mobileOpen ? 'block' : 'none', md: 'none' },
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          zIndex: theme.zIndex.drawer,
          overflowY: 'auto',
        }}
      >
        <Box className="mobile-nav-list" sx={{ p: 2 }}>
          {menuItems.map((item) => {
            const isActive =
              item.path !== '/logout' &&
              (item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path));

            const isLogin = item.path === '/login';

            return (
              <Button
                key={item.text}
                fullWidth
                color="inherit"
                onClick={() => {
                  handleMenuClick(item);
                  setMobileOpen(false);
                }}
                sx={{
                  justifyContent: 'flex-start',
                  mb: 1.5,
                  color: '#f5f5f5',
                  fontWeight: isActive ? 700 : 500,
                  borderRadius: 1.5,
                  padding: '14px 16px',
                  backgroundColor: isLogin
                    ? '#ff6b00'
                    : isActive
                      ? 'rgba(255,107,0,0.18)'
                      : 'rgba(20,20,20,0.85)',
                  '&:hover': {
                    backgroundColor: isLogin
                      ? '#ff7d1a'
                      : 'rgba(255,107,0,0.25)',
                  },
                  border: isActive ? '1px solid rgba(255,107,0,0.45)' : '1px solid rgba(255,255,255,0.05)'
                }}
                startIcon={item.icon}
              >
                {item.text}
              </Button>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          flex: 1,
        }}
      >
        <motion.div
          className="layout-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            flexGrow: 1,
            padding: '24px',
            width: '100%',
            marginTop: '64px',
            marginBottom: 0,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderedChildren}
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
