import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Styles
import './styles/global.css';
import './styles/theme.css';
import './styles/components.css';
import './styles/animations.css';
import './styles/responsive.css';

// Video.js styles
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/sea/index.css';

// Pages
import Home from './pages/Home';
import VideoPlayer from './pages/VideoPlayer';
import Search from './pages/Search';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Models from './pages/Models';
import ModelProfile from './pages/ModelProfile';
import Channels from './pages/Channels';
import ChannelProfile from './pages/ChannelProfile';
import Categories from './pages/Categories';
import CategoryProfile from './pages/CategoryProfile';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DMCA from './pages/DMCA';
import Section2257 from './pages/2257';
import Chat from './pages/Chat';
import Support from './pages/Support';
import ContentRemoval from './pages/ContentRemoval';
import VerifyEmail from './pages/VerifyEmail';
import NotFound from './pages/NotFound';

// Layout
import Layout from './components/Layout';

// Auth
import { AuthProvider } from './components/Auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';

// Age Verification
import { AgeVerificationProvider } from './components/AgeVerification/AgeVerificationProvider';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff6b6b',
    },
    secondary: {
      main: '#4ecdc4',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Google OAuth Client ID - Environment variable'dan al veya fallback kullan
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// Google Client ID kontrolü
console.log('🔍 App.tsx - GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NOT SET');
if (!GOOGLE_CLIENT_ID && process.env.NODE_ENV === 'development') {
  console.warn('⚠️ REACT_APP_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.');
  console.warn('Please add REACT_APP_GOOGLE_CLIENT_ID to your .env file');
}

function App() {
  // Client ID yoksa placeholder kullan (GoogleOAuthProvider boş string kabul etmez)
  const clientIdForProvider = GOOGLE_CLIENT_ID || 'placeholder-client-id';
  
  return (
    <HelmetProvider>
      <GoogleOAuthProvider clientId={clientIdForProvider}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            <AgeVerificationProvider>
              <AuthProvider>
                <Router>
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="/video/:id" element={<VideoPlayer />} />
                    <Route path="/search" element={<Search />} />
                    <Route
                      path="/upload"
                      element={
                        process.env.NODE_ENV === 'development' ? (
                          <Upload />
                        ) : (
                          <ProtectedRoute requireAuth requireAdmin>
                            <Upload />
                          </ProtectedRoute>
                        )
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute requireAuth>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        process.env.NODE_ENV === 'development' ? (
                          <Admin />
                        ) : (
                          <ProtectedRoute requireAuth requireAdmin>
                            <Admin />
                          </ProtectedRoute>
                        )
                      }
                    />
                    <Route path="/models" element={<Models />} />
                    <Route path="/models/:modelName" element={<ModelProfile />} />
                    <Route path="/channels" element={<Channels />} />
                    <Route path="/channels/:channelName" element={<ChannelProfile />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/categories/:categoryName" element={<CategoryProfile />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/dmca" element={<DMCA />} />
                    <Route path="/2257" element={<Section2257 />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/content-removal" element={<ContentRemoval />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify" element={<VerifyEmail />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
                <Toaster position="top-right" />
              </Router>
          </AuthProvider>
        </AgeVerificationProvider>
      </ErrorBoundary>
    </ThemeProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  );
}

export default App;