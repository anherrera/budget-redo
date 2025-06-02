import React from 'react';
import { LoginWithGithub } from "./LoginWithGithub";
import { LoginWithGoogle } from "./LoginWithGoogle";
import { Box, Typography, Stack } from "@mui/material";

export const LoginForm = () => {
    return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight={600}>
                Welcome to Budget Tracker
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                Take control of your finances with real-time budget tracking and forecasting.
            </Typography>
            
            <Stack spacing={2} sx={{ maxWidth: 300, mx: 'auto' }}>
                <LoginWithGithub />
                <LoginWithGoogle />
            </Stack>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                Secure login powered by OAuth
            </Typography>
        </Box>
    );
};
