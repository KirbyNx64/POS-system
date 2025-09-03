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
import { PointOfSale, History, QrCodeScanner } from '@mui/icons-material';
import PointOfSaleTab from './PointOfSaleTab';
import SalesHistoryTab from './SalesHistoryTab';
import CashierTab from './CashierTab';

function TabPanel({ children, value, index, isMobile = false, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sales-tabpanel-${index}`}
      aria-labelledby={`sales-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: isMobile ? 1 : 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Sales() {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom
        sx={{ fontSize: isMobile ? '1.3rem' : '2.125rem', mb: isMobile ? 2 : 3 }}
      >
        Módulo de Ventas
      </Typography>

      <Paper elevation={isMobile ? 0 : 1} sx={{ mb: isMobile ? 2 : 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            '& .MuiTab-root': {
              minHeight: isMobile ? '48px' : '48px',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              padding: isMobile ? '6px 8px' : '12px 16px'
            },
            '& .MuiTab-iconWrapper': {
              marginBottom: isMobile ? '4px' : '6px'
            }
          }}
        >
          <Tab 
            icon={<QrCodeScanner fontSize={isMobile ? 'small' : 'medium'} />} 
            label={isMobile ? "Cajero" : "Cajero POS"} 
            id="sales-tab-0"
            aria-controls="sales-tabpanel-0"
          />
          <Tab 
            icon={<PointOfSale fontSize={isMobile ? 'small' : 'medium'} />} 
            label={isMobile ? "POS" : "Punto de Venta"} 
            id="sales-tab-1"
            aria-controls="sales-tabpanel-1"
          />
          <Tab 
            icon={<History fontSize={isMobile ? 'small' : 'medium'} />} 
            label={isMobile ? "Historial" : "Historial de Ventas"} 
            id="sales-tab-2"
            aria-controls="sales-tabpanel-2"
          />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0} isMobile={isMobile}>
        <CashierTab />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1} isMobile={isMobile}>
        <PointOfSaleTab />
      </TabPanel>
      
      <TabPanel value={activeTab} index={2} isMobile={isMobile}>
        <SalesHistoryTab />
      </TabPanel>
    </Box>
  );
}

export default Sales;
