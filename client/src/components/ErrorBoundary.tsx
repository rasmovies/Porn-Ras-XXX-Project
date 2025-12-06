import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { ErrorOutline, Home } from '@mui/icons-material';
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />;
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error: Error | null; errorInfo: ErrorInfo | null }> = ({
  error,
  errorInfo,
}) => {

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <ErrorOutline sx={{ fontSize: 80, color: '#ff6b6b' }} />
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Bir şeyler ters gitti!
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
        </Typography>

        {process.env.NODE_ENV === 'development' && error && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              width: '100%',
              textAlign: 'left',
            }}
          >
            <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 1 }}>
              Hata Detayları (Development):
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', mb: 1 }}>
              {error.toString()}
            </Typography>
            {errorInfo && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                {errorInfo.componentStack}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => {
              window.location.href = '/';
            }}
            sx={{
              bgcolor: '#ff6b6b',
              '&:hover': { bgcolor: '#ff5252' },
            }}
          >
            Ana Sayfaya Dön
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              window.location.reload();
            }}
            sx={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              '&:hover': { borderColor: 'rgba(255,255,255,0.5)' },
            }}
          >
            Sayfayı Yenile
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ErrorBoundary;

