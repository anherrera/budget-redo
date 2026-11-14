import React from 'react';
import { Box, Chip } from '@mui/material';
import { CreditCard } from '@mui/icons-material';

// The title gives way before the icon and the Auto chip do.
const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 };

export const Title = ({ evt, hideAuto }) => {
    const titleElement = evt.autoPay === true ? (
        <span style={ellipsis}>{evt.title}</span>
    ) : (<strong style={ellipsis}>{evt.title}</strong>);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, maxWidth: '100%' }}>
            {evt.type === 'cc_payment' && <CreditCard fontSize="small" sx={{ color: 'warning.main', flexShrink: 0 }} />}
            {titleElement}
            {evt.autoPay && !hideAuto && (
                <Chip
                    label="Auto"
                    size="small"
                    variant="filled"
                    sx={{
                        flexShrink: 0,
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
