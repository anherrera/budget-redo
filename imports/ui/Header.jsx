import React from 'react';
import { LogoutOutlined, AccountCircleOutlined, DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import {AppBar, Box, Button, Toolbar, Typography, Chip, Avatar, IconButton, Tooltip} from "@mui/material";

export const Header = ({ user, logout, darkMode, toggleDarkMode }) => {
    return (
        <Box sx={{ flexGrow: 1, mb: 1.5 }}>
            <AppBar position="static" elevation={0} sx={{ borderRadius: '0 0 16px 16px' }}>
                <Toolbar sx={{ minHeight: '56px !important', py: 0.5 }}>
                    <Typography variant="h6" component="div" sx={{
                        flexGrow: 1,
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Budget Tracker
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                            <IconButton
                                onClick={toggleDarkMode}
                                sx={{
                                    color: 'white',
                                    transition: 'transform 0.3s ease',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        transform: 'rotate(30deg)',
                                    },
                                }}
                            >
                                {darkMode ? <LightModeOutlined /> : <DarkModeOutlined />}
                            </IconButton>
                        </Tooltip>

                        { user ? (
                            <>
                                <Chip
                                    avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><AccountCircleOutlined /></Avatar>}
                                    label={user.username || user.profile?.name || 'User'}
                                    variant="filled"
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.12)',
                                        backdropFilter: 'blur(8px)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        '& .MuiChip-avatar': { color: 'white' },
                                    }}
                                />
                                <Button
                                    onClick={logout}
                                    variant="text"
                                    startIcon={<LogoutOutlined />}
                                    sx={{
                                        color: 'rgba(255,255,255,0.85)',
                                        fontWeight: 500,
                                        '&:hover': {
                                            color: 'white',
                                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                    }}
                                >
                                    Sign Out
                                </Button>
                            </>
                            ) : (
                            <Button color="inherit" variant="outlined" sx={{ borderColor: 'rgba(255, 255, 255, 0.5)' }}>
                                Sign In
                            </Button>
                            )
                        }
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
};
