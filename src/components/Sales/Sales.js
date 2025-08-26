import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import { PointOfSale, History, QrCodeScanner } from '@mui/icons-material';
import PointOfSaleTab from './PointOfSaleTab';
import SalesHistoryTab from './SalesHistoryTab';
import CashierTab from './CashierTab';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sales-tabpanel-${index}`}
      aria-labelledby={`sales-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function Sales() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Módulo de Ventas
      </Typography>

      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            icon={<QrCodeScanner />} 
            label="Cajero POS" 
            id="sales-tab-0"
            aria-controls="sales-tabpanel-0"
          />
          <Tab 
            icon={<PointOfSale />} 
            label="Punto de Venta" 
            id="sales-tab-1"
            aria-controls="sales-tabpanel-1"
          />
          <Tab 
            icon={<History />} 
            label="Historial de Ventas" 
            id="sales-tab-2"
            aria-controls="sales-tabpanel-2"
          />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <CashierTab />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        <PointOfSaleTab />
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <SalesHistoryTab />
      </TabPanel>
    </Box>
  );
}

export default Sales;
