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
  CardContent
} from '@mui/material';
import { Business, Save, Preview } from '@mui/icons-material';
import { useApp } from '../../contexts/AppContext';

function BusinessSettings() {
  const { state, dispatch } = useApp();
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    rfc: '',
    website: ''
  });
  const [saved, setSaved] = useState(false);

  // Cargar información del negocio desde el contexto
  useEffect(() => {
    if (state.businessInfo) {
      setBusinessInfo(state.businessInfo);
    }
  }, [state.businessInfo]);

  const handleInputChange = (field, value) => {
    setBusinessInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_BUSINESS_INFO',
      payload: businessInfo
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
      printInvoice(sampleSaleData, businessInfo);
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Business sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5">Información del Negocio</Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" mb={3}>
            Configura la información que aparecerá en las facturas y documentos del sistema.
          </Typography>

          {saved && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Información del negocio guardada exitosamente.
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Información básica */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Negocio"
                value={businessInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Mi Tienda S.A. de C.V."
                helperText="Este nombre aparecerá en el encabezado de las facturas"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="RFC"
                value={businessInfo.rfc}
                onChange={(e) => handleInputChange('rfc', e.target.value)}
                placeholder="Ej: ABC123456789"
                helperText="Registro Federal de Contribuyentes"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={businessInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Ej: Av. Principal 123, Col. Centro, Ciudad, CP 12345"
                multiline
                rows={2}
                helperText="Dirección completa del negocio"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={businessInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ej: (55) 1234-5678"
                helperText="Teléfono de contacto"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={businessInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Ej: contacto@mitienda.com"
                helperText="Correo electrónico de contacto"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sitio Web"
                value={businessInfo.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="Ej: https://www.mitienda.com"
                helperText="Sitio web del negocio (opcional)"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Botones de acción */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Preview />}
              onClick={handlePreview}
              disabled={!businessInfo.name}
            >
              Previsualizar Factura
            </Button>
            
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
            >
              Guardar Información
            </Button>
          </Box>
        </Paper>
      </Grid>

      {/* Vista previa de la información */}
      <Grid item xs={12} md={6}>
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vista Previa de la Factura
            </Typography>
            
            {businessInfo.name ? (
              <Box>
                <Typography variant="h5" color="primary" gutterBottom>
                  {businessInfo.name}
                </Typography>
                
                {businessInfo.address && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {businessInfo.address}
                  </Typography>
                )}
                
                <Box display="flex" gap={2} flexWrap="wrap" mt={1}>
                  {businessInfo.phone && (
                    <Typography variant="body2" color="text.secondary">
                      📞 {businessInfo.phone}
                    </Typography>
                  )}
                  
                  {businessInfo.email && (
                    <Typography variant="body2" color="text.secondary">
                      ✉️ {businessInfo.email}
                    </Typography>
                  )}
                  
                  {businessInfo.website && (
                    <Typography variant="body2" color="text.secondary">
                      🌐 {businessInfo.website}
                    </Typography>
                  )}
                </Box>
                
                {businessInfo.rfc && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    RFC: {businessInfo.rfc}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Completa la información del negocio para ver una vista previa.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Información adicional */}
      <Grid item xs={12} md={6}>
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información Adicional
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              La información configurada aquí se utilizará para:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Generar facturas en PDF
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Imprimir recibos de venta
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Reportes y documentación
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Identificación del negocio en el sistema
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Nota:</strong> Los campos marcados con * son obligatorios para generar facturas correctamente.
            </Alert>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default BusinessSettings;
