import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import TaxSettings from './TaxSettings';
import BusinessSettings from './BusinessSettings';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <SettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">Configuración del Sistema</Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          Configura los parámetros del sistema, impuestos e información del negocio.
        </Typography>
      </Paper>

      <Paper elevation={2}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="configuración del sistema"
            sx={{ px: 3 }}
          >
            <Tab label="Información del Negocio" />
            <Tab label="Configuración de Impuestos" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <BusinessSettings />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TaxSettings />
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default Settings;
