import React from 'react';
import { MdLogout } from "react-icons/md";
import {AppBar, Box, Button, Toolbar, Typography} from "@mui/material";

export const Header = ({ user, logout }) => {
    return (
        <Box sx={{ flexGrow: 1, marginBottom: 2 }}>
            <AppBar position="static" variant="">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Budget Your Life. In Real Time.
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
