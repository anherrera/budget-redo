import React from 'react';
import {Box, Typography} from "@mui/material";

export const AccentBar = ({ gradient }) => (
    <Box sx={{ height: 3, background: gradient, borderRadius: '12px 12px 0 0' }} />
);

export const SectionTitle = ({ icon, title, chip }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography variant="subtitle1" color="text.primary" fontWeight={600} noWrap>{title}</Typography>
        {chip}
    </Box>
);
