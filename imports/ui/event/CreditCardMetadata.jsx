import React from 'react';
import { Box, Typography } from '@mui/material';
import { CreditCard } from '@mui/icons-material';

const CreditCardMetadata = ({ event }) => {
  const { ccStatement } = event;

  if (event.type !== 'cc_payment') {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Box sx={{ 
      mt: 1, 
      p: 1, 
      backgroundColor: '#f5f5f5', 
      borderRadius: 1,
      border: '1px solid #e0e0e0'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CreditCard fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          Statement: {formatDate(ccStatement?.statementDate)}
        </Typography>
      </Box>
    </Box>
  );
};

export default CreditCardMetadata;