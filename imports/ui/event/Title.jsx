import React from 'react';
import { Box } from '@mui/material';
import { CreditCard } from '@mui/icons-material';

export const Title = ({ evt }) => {
    const titleElement = evt.autoPay === true ? (
        <span>{evt.title}</span>
    ) : (<strong>{evt.title}</strong>);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {evt.type === 'cc_payment' && <CreditCard fontSize="small" />}
            {titleElement}
        </Box>
    );
}
