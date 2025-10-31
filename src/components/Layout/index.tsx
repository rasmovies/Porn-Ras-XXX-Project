import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Badge,
  Popover,
  useMediaQuery,
  useTheme,
  MenuItem,
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
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../Auth/AuthProvider';
import { adminUserService, notificationService } from '../../services/database';
import Footer from '../Footer/Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { openLoginModal, isAuthenticated, logout, user } = useAuth();

  // Check if user is admin from Supabase and load notifications
  useEffect(() => {
    const loadData = async () => {
      if (user?.username) {
        const adminStatus = await adminUserService.isAdmin(user.username);
        setIsAdmin(adminStatus);
        
        // Load notifications
        try {
          const userNotifications = await notificationService.getByUserId(user.username);
          setNotifications(userNotifications);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      } else {
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


  return (
    <Box sx={{ display: 'flex' }}>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
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
                }}
              />
            </motion.div>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
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
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.text}
            </Button>
          </motion.div>
        ))}
      </Box>
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
                        // Update notification in state
                        setNotifications(notifications.map(n =>
                          n.id === notification.id ? { ...n, is_read: true } : n
                        ));
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

      {/* Sidebar removed */}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          flex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            flexGrow: 1,
            padding: '24px',
            width: '100%',
            marginTop: '64px',
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
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
