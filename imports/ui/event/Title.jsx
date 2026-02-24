import React from 'react';
import { Box, Chip } from '@mui/material';
import { CreditCard } from '@mui/icons-material';

export const Title = ({ evt }) => {
    const titleElement = evt.autoPay === true ? (
        <span>{evt.title}</span>
    ) : (<strong>{evt.title}</strong>);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {evt.type === 'cc_payment' && <CreditCard fontSize="small" sx={{ color: 'warning.main' }} />}
            {titleElement}
            {evt.autoPay && (
                <Chip
                    label="Auto"
                    size="small"
                    variant="filled"
                    sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        bgcolor: 'rgba(0,150,136,0.12)',
                        color: 'secondary.main',
                    }}
                />
            )}
        </Box>
    );
}
