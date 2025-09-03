import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  InputAdornment,
  Alert,
  CircularProgress,
  Box,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useTaxSettings } from '../../hooks/useTaxSettings';

function TaxSettings({ open, onClose, isMobile = false }) {
  const { taxSettings, loading, error, saveTaxSettings } = useTaxSettings();
  const theme = useTheme();
  const isMobileDetected = useMediaQuery(theme.breakpoints.down('md'));
  const mobile = isMobile || isMobileDetected;
  const [settings, setSettings] = useState({
    enabled: true,
    rate: '19', // Porcentaje por defecto
    name: 'IVA'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Actualizar settings cuando se carguen los datos de Firebase
  useEffect(() => {
    if (taxSettings) {
      setSettings({
        enabled: taxSettings.enabled,
        rate: (taxSettings.rate * 100).toString(), // Convertir a porcentaje para mostrar
        name: taxSettings.name
      });
    }
  }, [taxSettings]);

  const handleChange = (field) => (event) => {
    const value = field === 'enabled' ? event.target.checked : event.target.value;
    setSettings(prev => ({ ...prev, [field]: value }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!settings.name.trim()) {
      newErrors.name = 'El nombre del impuesto es requerido';
    }

    if (settings.enabled) {
      const rate = parseFloat(settings.rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        newErrors.rate = 'El porcentaje debe estar entre 0 y 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      
      const updatedSettings = {
        enabled: settings.enabled,
        rate: settings.enabled ? parseFloat(settings.rate) / 100 : 0, // Convertir porcentaje a decimal
        name: settings.name.trim()
      };

      await saveTaxSettings(updatedSettings);
      onClose();
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setErrors({ general: 'Error al guardar la configuración. Inténtalo de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (taxSettings) {
      setSettings({
        enabled: taxSettings.enabled,
        rate: (taxSettings.rate * 100).toString(),
        name: taxSettings.name
      });
    }
    setErrors({});
  };

  // Si se usa como modal (con open y onClose)
  if (open !== undefined) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Configuración de Impuestos</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {loading && (
              <Grid item xs={12}>
                <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography>Cargando configuración...</Typography>
                </Box>
              </Grid>
            )}

            {error && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  Error al cargar la configuración: {error}
                </Alert>
              </Grid>
            )}

            {errors.general && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.general}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Configura si deseas aplicar impuestos (como IVA) a las ventas y define el porcentaje.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={handleChange('enabled')}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body1">
                    {settings.enabled ? 'Impuestos habilitados' : 'Impuestos deshabilitados'}
                  </Typography>
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Impuesto"
                value={settings.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name || 'Ej: IVA, IGV, Tax'}
                placeholder="IVA"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Porcentaje de Impuesto"
                type="number"
                value={settings.rate}
                onChange={handleChange('rate')}
                disabled={!settings.enabled}
                error={!!errors.rate}
                helperText={errors.rate || 'Porcentaje a aplicar'}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
              />
            </Grid>

            {settings.enabled && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Se aplicará {settings.name} del {settings.rate}% a todas las ventas
                </Alert>
              </Grid>
            )}

            {!settings.enabled && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  No se aplicarán impuestos a las ventas
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReset} disabled={loading || saving}>
            Restablecer
          </Button>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Si se usa como página (sin open/onClose)
  return (
    <Grid container spacing={mobile ? 2 : 3}>
      <Grid item xs={12}>
        <Paper elevation={mobile ? 0 : 2} sx={{ p: mobile ? 3 : 3 }}>
          <Typography 
            variant={mobile ? "h6" : "h5"}
            gutterBottom
            sx={{ fontSize: mobile ? '1.25rem' : '1.5rem', mb: mobile ? 2 : 3 }}
          >
            Configuración de Impuestos
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ fontSize: mobile ? '0.875rem' : '1rem', mb: mobile ? 2 : 3 }}
          >
            Configura si deseas aplicar impuestos (como IVA) a las ventas y define el porcentaje.
          </Typography>

          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={2}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Cargando configuración...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error al cargar la configuración: {error}
            </Alert>
          )}

          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.general}
            </Alert>
          )}

          <Grid container spacing={mobile ? 2 : 3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={handleChange('enabled')}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body1">
                    {settings.enabled ? 'Impuestos habilitados' : 'Impuestos deshabilitados'}
                  </Typography>
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Impuesto"
                value={settings.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name || 'Ej: IVA, IGV, Tax'}
                placeholder="IVA"
                size={mobile ? "small" : "medium"}
                sx={{ mb: mobile ? 2 : 0 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Porcentaje de Impuesto"
                type="number"
                value={settings.rate}
                onChange={handleChange('rate')}
                disabled={!settings.enabled}
                error={!!errors.rate}
                helperText={errors.rate || 'Porcentaje a aplicar'}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                size={mobile ? "small" : "medium"}
                sx={{ mb: mobile ? 2 : 0 }}
              />
            </Grid>

            {settings.enabled && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Se aplicará {settings.name} del {settings.rate}% a todas las ventas
                </Alert>
              </Grid>
            )}

            {!settings.enabled && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  No se aplicarán impuestos a las ventas
                </Alert>
              </Grid>
            )}
          </Grid>

          <Box 
            display="flex" 
            gap={mobile ? 1 : 2} 
            justifyContent={mobile ? "center" : "flex-end"}
            flexDirection={mobile ? "column" : "row"}
            mt={3}
          >
            <Button 
              onClick={handleReset} 
              disabled={loading || saving}
              fullWidth={mobile}
              size={mobile ? "small" : "medium"}
            >
              Restablecer
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              disabled={loading || saving}
              startIcon={saving ? <CircularProgress size={16} /> : null}
              fullWidth={mobile}
              size={mobile ? "small" : "medium"}
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default TaxSettings;
