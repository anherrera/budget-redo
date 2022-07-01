import React, {useState} from 'react';
import {MdLogout} from "react-icons/all";
import {AppBar, Box, Button, Container, Toolbar, Typography} from "@mui/material";

export const Header = ({ user, logout }) => {
    return (

        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" variant="">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Budget your life you nincompoop
                    </Typography>
                    { user ? (
                        <Button onClick={logout} variant="outline">
                            {user.username || user.profile.name}
                            &nbsp;<MdLogout />
                        </Button>
                        ) : (
                        <Button color="inherit">Login</Button>
                        )
                    }
                </Toolbar>
            </AppBar>
        </Box>
    );
};