import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import TaxSettings from './TaxSettings';
import BusinessSettings from './BusinessSettings';

function TabPanel({ children, value, index, isMobile = false, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: isMobile ? 2 : 3 }}>{children}</Box>}
    </div>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Paper elevation={isMobile ? 0 : 2} sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3 }}>
        <Box display="flex" alignItems="center" mb={isMobile ? 1 : 2}>
          <SettingsIcon sx={{ 
            mr: isMobile ? 1 : 2, 
            color: 'primary.main',
            fontSize: isMobile ? '1.5rem' : '2rem'
          }} />
          <Typography 
            variant={isMobile ? "h5" : "h4"}
            sx={{ fontSize: isMobile ? '1.3rem' : '2.125rem' }}
          >
            Configuración del Sistema
          </Typography>
        </Box>
        
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
        >
          Configura los parámetros del sistema, impuestos e información del negocio.
        </Typography>
      </Paper>

      <Paper elevation={isMobile ? 0 : 2}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="configuración del sistema"
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{ 
              px: isMobile ? 1 : 3,
              '& .MuiTab-root': {
                minHeight: isMobile ? '48px' : '48px',
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                padding: isMobile ? '6px 8px' : '12px 16px'
              }
            }}
          >
            <Tab 
              label={isMobile ? "Negocio" : "Información del Negocio"} 
            />
            <Tab 
              label={isMobile ? "Impuestos" : "Configuración de Impuestos"} 
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0} isMobile={isMobile}>
          <BusinessSettings />
        </TabPanel>

        <TabPanel value={activeTab} index={1} isMobile={isMobile}>
          <TaxSettings />
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default Settings;
