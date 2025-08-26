import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { useApp } from '../../contexts/AppContext';

function TaxSettings({ open, onClose }) {
  const { state, dispatch } = useApp();
  const [settings, setSettings] = useState({
    enabled: state.taxSettings.enabled,
    rate: (state.taxSettings.rate * 100).toString(), // Convertir a porcentaje para mostrar
    name: state.taxSettings.name
  });
  const [errors, setErrors] = useState({});

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

  const handleSave = () => {
    if (!validateForm()) return;

    const updatedSettings = {
      enabled: settings.enabled,
      rate: settings.enabled ? parseFloat(settings.rate) / 100 : 0, // Convertir porcentaje a decimal
      name: settings.name.trim()
    };

    dispatch({
      type: 'UPDATE_TAX_SETTINGS',
      payload: updatedSettings
    });

    onClose();
  };

  const handleReset = () => {
    setSettings({
      enabled: state.taxSettings.enabled,
      rate: (state.taxSettings.rate * 100).toString(),
      name: state.taxSettings.name
    });
    setErrors({});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configuración de Impuestos</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
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
        <Button onClick={handleReset}>Restablecer</Button>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">
          Guardar Configuración
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TaxSettings;
