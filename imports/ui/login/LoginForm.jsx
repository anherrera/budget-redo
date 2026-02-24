import React from 'react';
import { LoginWithGithub } from "./LoginWithGithub";
import { LoginWithGoogle } from "./LoginWithGoogle";
import { Box, Typography, Stack } from "@mui/material";
import { AccountBalanceWallet } from "@mui/icons-material";

export const LoginForm = () => {
    return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                backgroundImage: (theme) => theme.palette.gradient.hero,
                boxShadow: '0 4px 16px rgba(103,58,183,0.3)',
            }}>
                <AccountBalanceWallet sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700} sx={{
                background: (theme) => theme.palette.gradient.hero,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                Budget Tracker
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
