import React, { createContext, useContext, useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

interface AuthContextType {
  openLoginModal: () => void;
  openRegisterModal: () => void;
  closeModals: () => void;
  isAuthenticated: boolean;
  user: any | null;
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  
  // Check if user is authenticated (check localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [user, setUser] = useState<any | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
  };

  const openRegisterModal = () => {
    setIsRegisterModalOpen(true);
    setIsLoginModalOpen(false);
  };

  const closeModals = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(false);
  };

  const switchToRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const switchToLogin = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const login = (userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  // Development mode: Auto-login as admin
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment && !isAuthenticated) {
      // Auto-login as admin in development
      const devAdminUser = {
        username: 'admin',
        email: 'admin@localhost',
        id: 'dev-admin-id',
        isAdmin: true
      };
      
      login(devAdminUser);
      console.log('🔧 Development mode: Auto-logged in as admin');
    }
  }, []); // Only run once on mount

  return (
    <AuthContext.Provider value={{ openLoginModal, openRegisterModal, closeModals, isAuthenticated, user, login, logout }}>
      {children}
      <LoginModal
        open={isLoginModalOpen}
        onClose={closeModals}
        onSwitchToRegister={switchToRegister}
        onLoginSuccess={() => {
          // Navigate to profile page on login success
          window.location.href = '/profile';
        }}
      />
      <RegisterModal
        open={isRegisterModalOpen}
        onClose={closeModals}
        onSwitchToLogin={switchToLogin}
      />
    </AuthContext.Provider>
  );
};


