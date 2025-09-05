import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Business, Save, Preview } from '@mui/icons-material';
import { useBusinessInfo } from '../../hooks/useBusinessInfo';

function BusinessSettings({ isMobile = false }) {
  const { businessInfo, loading, error, saveBusinessInfo } = useBusinessInfo();
  const theme = useTheme();
  const isMobileDetected = useMediaQuery(theme.breakpoints.down('md'));
  const mobile = isMobile || isMobileDetected;
  const [localBusinessInfo, setLocalBusinessInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    rfc: '',
    website: ''
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sincronizar información local con la información de Firebase
  useEffect(() => {
    if (businessInfo) {
      setLocalBusinessInfo(businessInfo);
    }
  }, [businessInfo]);

  const handleInputChange = (field, value) => {
    setLocalBusinessInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveBusinessInfo(localBusinessInfo);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('❌ BusinessSettings: Error guardando información del negocio:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Crear datos de ejemplo para previsualizar la factura
    const sampleSaleData = {
      items: [
        { name: 'Producto de Ejemplo', quantity: 2, price: 25.50 },
        { name: 'Otro Producto', quantity: 1, price: 15.00 }
      ],
      subtotal: 66.00,
      tax: 10.56,
      total: 76.56,
      paymentMethod: 'Efectivo'
    };

    // Importar dinámicamente para evitar problemas de SSR
    import('../Sales/InvoiceGenerator').then(({ printInvoice }) => {
      printInvoice(sampleSaleData, localBusinessInfo);
    });
  };

  return (
    <Box sx={{ px: mobile ? 0 : 0 }}>
      <Grid container spacing={mobile ? 1 : 3}>
      <Grid item xs={12}>
        <Paper elevation={mobile ? 0 : 2} sx={{ 
          p: mobile ? 4 : 3, 
          pl: mobile ? 2 : 3,
          mx: mobile ? 0 : 0 
        }}>
          <Box display="flex" alignItems="center" mb={mobile ? 2 : 3}>
            <Business sx={{ 
              mr: mobile ? 1 : 2, 
              color: 'primary.main',
              fontSize: mobile ? '1.5rem' : '2rem'
            }} />
            <Typography 
              variant={mobile ? "h6" : "h5"}
              sx={{ fontSize: mobile ? '1.25rem' : '1.5rem' }}
            >
              Información del Negocio
            </Typography>
          </Box>
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            mb={mobile ? 2 : 3}
            sx={{ fontSize: mobile ? '0.875rem' : '1rem' }}
          >
            Configura la información que aparecerá en las facturas y documentos del sistema.
          </Typography>

          {loading && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                Cargando información del negocio...
              </Box>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error: {error}
            </Alert>
          )}

          {saved && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Información del negocio guardada exitosamente en Firebase.
            </Alert>
          )}

          <Grid container spacing={mobile ? 3 : 3}>
            {/* Información básica */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Negocio"
                value={localBusinessInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Mi Tienda S.A. de C.V."
                helperText="Este nombre aparecerá en el encabezado de las facturas"
                disabled={loading}
                size={mobile ? "small" : "medium"}
                sx={{ mb: mobile ? 2 : 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="RFC"
                value={localBusinessInfo.rfc}
                onChange={(e) => handleInputChange('rfc', e.target.value)}
                placeholder="Ej: ABC123456789"
                helperText="Registro Federal de Contribuyentes"
                disabled={loading}
                size={mobile ? "small" : "medium"}
                sx={{ mb: mobile ? 2 : 0 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={localBusinessInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Ej: Av. Principal 123, Col. Centro, Ciudad, CP 12345"
                multiline
                rows={mobile ? 2 : 2}
                helperText="Dirección completa del negocio"
                disabled={loading}
                size={mobile ? "small" : "medium"}
                sx={{ mb: mobile ? 2 : 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={localBusinessInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ej: (55) 1234-5678"
                helperText="Teléfono de contacto"
                disabled={loading}
                size={mobile ? "small" : "medium"}
                sx={{ mb: mobile ? 2 : 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={localBusinessInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Ej: contacto@mitienda.com"
                helperText="Correo electrónico de contacto"
                disabled={loading}
                size={mobile ? "small" : "medium"}
                sx={{ mb: mobile ? 2 : 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sitio Web"
                value={localBusinessInfo.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="Ej: https://www.mitienda.com"
                helperText="Sitio web del negocio (opcional)"
                disabled={loading}
                size={mobile ? "small" : "medium"}
                sx={{ mb: mobile ? 2 : 0 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: mobile ? 2 : 4 }} />

          {/* Botones de acción */}
          <Box 
            display="flex" 
            gap={mobile ? 1 : 2} 
            justifyContent={mobile ? "center" : "flex-end"}
            flexDirection={mobile ? "column" : "row"}
          >
            <Button
              variant="outlined"
              startIcon={<Preview fontSize={mobile ? "small" : "medium"} />}
              onClick={handlePreview}
              disabled={!localBusinessInfo.name || loading}
              fullWidth={mobile}
              size={mobile ? "small" : "medium"}
            >
              Previsualizar Factura
            </Button>
            
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <Save fontSize={mobile ? "small" : "medium"} />}
              onClick={handleSave}
              disabled={loading || saving}
              fullWidth={mobile}
              size={mobile ? "small" : "medium"}
            >
              {saving ? 'Guardando...' : 'Guardar Información'}
            </Button>
          </Box>
        </Paper>
      </Grid>

      {/* Vista previa de la información */}
      <Grid item xs={12} md={6}>
        <Card elevation={mobile ? 0 : 1}>
          <CardContent sx={{ p: mobile ? 3 : 3 }}>
            <Typography 
              variant={mobile ? "subtitle1" : "h6"} 
              gutterBottom
              sx={{ fontSize: mobile ? '1rem' : '1.25rem' }}
            >
              Vista Previa de la Factura
            </Typography>
            
            {localBusinessInfo.name ? (
              <Box>
                <Typography 
                  variant={mobile ? "h6" : "h5"} 
                  color="primary" 
                  gutterBottom
                  sx={{ fontSize: mobile ? '1.1rem' : '1.5rem' }}
                >
                  {localBusinessInfo.name}
                </Typography>
                
                {localBusinessInfo.address && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
                  >
                    {localBusinessInfo.address}
                  </Typography>
                )}
                
                <Box 
                  display="flex" 
                  gap={mobile ? 1 : 2} 
                  flexWrap="wrap" 
                  mt={1}
                  flexDirection={mobile ? "column" : "row"}
                >
                  {localBusinessInfo.phone && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
                    >
                      📞 {localBusinessInfo.phone}
                    </Typography>
                  )}
                  
                  {localBusinessInfo.email && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
                    >
                      ✉️ {localBusinessInfo.email}
                    </Typography>
                  )}
                  
                  {localBusinessInfo.website && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
                    >
                      🌐 {localBusinessInfo.website}
                    </Typography>
                  )}
                </Box>
                
                {localBusinessInfo.rfc && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    mt={1}
                    sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
                  >
                    RFC: {localBusinessInfo.rfc}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
              >
                Completa la información del negocio para ver una vista previa.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Información adicional */}
      <Grid item xs={12} md={6}>
        <Card elevation={mobile ? 0 : 1}>
          <CardContent sx={{ p: mobile ? 3 : 3 }}>
            <Typography 
              variant={mobile ? "subtitle1" : "h6"} 
              gutterBottom
              sx={{ fontSize: mobile ? '1rem' : '1.25rem' }}
            >
              Información Adicional
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              paragraph
              sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
            >
              La información configurada aquí se utilizará para:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography 
                component="li" 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
              >
                Generar facturas en PDF
              </Typography>
              <Typography 
                component="li" 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
              >
                Imprimir recibos de venta
              </Typography>
              <Typography 
                component="li" 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
              >
                Reportes y documentación
              </Typography>
              <Typography 
                component="li" 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: mobile ? '0.8rem' : '0.875rem' }}
              >
                Identificación del negocio en el sistema
              </Typography>
            </Box>
            
            <Alert 
              severity="info" 
              sx={{ 
                mt: 2,
                fontSize: mobile ? '0.8rem' : '0.875rem'
              }}
            >
              <strong>Nota:</strong> Los campos marcados con * son obligatorios para generar facturas correctamente.
            </Alert>
          </CardContent>
        </Card>
      </Grid>
      </Grid>
    </Box>
  );
}

export default BusinessSettings;
