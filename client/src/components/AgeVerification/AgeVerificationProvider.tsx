import React, { createContext, useContext, useState, useEffect } from 'react';
import AgeVerificationModal from './AgeVerificationModal';

interface AgeVerificationContextType {
  isVerified: boolean;
  verifyAge: () => void;
}

const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined);

export const useAgeVerification = () => {
  const context = useContext(AgeVerificationContext);
  if (!context) {
    throw new Error('useAgeVerification must be used within an AgeVerificationProvider');
  }
  return context;
};

interface AgeVerificationProviderProps {
  children: React.ReactNode;
}

export const AgeVerificationProvider: React.FC<AgeVerificationProviderProps> = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already verified their age
    const hasVerified = localStorage.getItem('ageVerified');
    if (hasVerified === 'true') {
      setIsVerified(true);
    } else {
      // Show modal after a short delay for better UX
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('ageVerified', 'true');
    setIsVerified(true);
    setShowModal(false);
  };

  const handleDeny = () => {
    // Redirect to a safe page or show a message
    window.location.href = 'https://www.google.com';
  };

  const verifyAge = () => {
    setShowModal(true);
  };

  return (
    <AgeVerificationContext.Provider value={{ isVerified, verifyAge }}>
      {children}
      <AgeVerificationModal
        open={showModal}
        onConfirm={handleConfirm}
        onDeny={handleDeny}
      />
    </AgeVerificationContext.Provider>
  );
};






