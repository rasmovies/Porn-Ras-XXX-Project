import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Styles
import './styles/global.css';
import './styles/theme.css';
import './styles/components.css';
import './styles/animations.css';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AgeVerificationProvider>
          <AuthProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/video/:id" element={<VideoPlayer />} />
                  <Route path="/search" element={<Search />} />
                  <Route
                    path="/upload"
                    element={
                      <ProtectedRoute requireAuth requireAdmin>
                        <Upload />
                      </ProtectedRoute>
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
                      <ProtectedRoute requireAuth requireAdmin>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/models" element={<Models />} />
                  <Route path="/models/:modelName" element={<ModelProfile />} />
                  <Route path="/channels" element={<Channels />} />
                  <Route path="/channels/:channelName" element={<ChannelProfile />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:categoryName" element={<CategoryProfile />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
              <Toaster position="top-right" />
            </Router>
            </AuthProvider>
          </AgeVerificationProvider>
        </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;