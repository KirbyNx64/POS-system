import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Collapse,
  Typography,
  IconButton
} from '@mui/material';
import {
  Email as EmailIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

function EmailVerificationBanner() {
  const { user, resendEmailVerification, isEmailVerified } = useFirebaseAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  // No mostrar el banner si el email ya está verificado
  if (isEmailVerified() || !user) {
    return null;
  }

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setMessage('');
      
      await resendEmailVerification();
      setMessage('Email de verificación reenviado. Revisa tu bandeja de entrada y también la bandeja de spam.');
    } catch (error) {
      console.error('Error al reenviar email de verificación:', error);
      setMessage('Error al reenviar el email. Inténtalo de nuevo.');
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Collapse in={isOpen}>
      <Alert
        severity="warning"
        icon={<EmailIcon />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              color="inherit"
              size="small"
              onClick={handleResendVerification}
              disabled={isResending}
              startIcon={<RefreshIcon />}
            >
              {isResending ? 'Enviando...' : 'Reenviar'}
            </Button>
            <IconButton
              size="small"
              onClick={handleClose}
              color="inherit"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            ⚠️ Verifica tu dirección de email
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Tu cuenta no está verificada. Por favor, revisa tu bandeja de entrada <strong>y también la bandeja de spam</strong> y haz clic en el enlace de verificación que te enviamos a <strong>{user.email}</strong>
          </Typography>
          {message && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              {message}
            </Typography>
          )}
        </Box>
      </Alert>
    </Collapse>
  );
}

export default EmailVerificationBanner;
