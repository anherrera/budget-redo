import React from 'react';
import { LogoutOutlined, AccountCircleOutlined, DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import {AppBar, Box, Button, Toolbar, Typography, Chip, Avatar, IconButton, Tooltip} from "@mui/material";

export const Header = ({ user, logout, darkMode, toggleDarkMode }) => {
    return (
        <Box sx={{ flexGrow: 1, mb: 1.5 }}>
            <AppBar position="static" variant="">
                <Toolbar sx={{ minHeight: '56px !important', py: 0.5 }}>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Budget Tracker
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                            <IconButton 
                                onClick={toggleDarkMode} 
                                sx={{ 
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
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
                                        bgcolor: 'rgba(255, 255, 255, 0.15)', 
                                        color: 'white',
                                        '& .MuiChip-avatar': { color: 'white' }
                                    }}
                                />
                                <Button 
                                    onClick={logout} 
                                    variant="outlined"
                                    startIcon={<LogoutOutlined />}
                                    sx={{ 
                                        color: 'white', 
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                        '&:hover': { 
                                            borderColor: 'white',
                                            bgcolor: 'rgba(255, 255, 255, 0.1)'
                                        }
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
