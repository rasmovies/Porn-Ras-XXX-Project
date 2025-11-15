import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';

const ResponsiveEntryRedirect = () => {
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isMobileOrTablet) {
      if (location.pathname === '/' || location.pathname === '') {
        navigate('/mobile', { replace: true });
      }
    } else {
      if (location.pathname.startsWith('/mobile')) {
        navigate('/', { replace: true });
      }
    }
  }, [isMobileOrTablet, location.pathname, navigate]);

  return null;
};

export default ResponsiveEntryRedirect;
