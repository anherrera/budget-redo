import React from 'react';
import { Meteor } from 'meteor/meteor';
import {Button} from "@mui/material";
import {GitHub} from "@mui/icons-material";

export const LoginWithGithub = () => {
    const handleGithubLogin = () => {
        Meteor.loginWithGithub({
            requestPermissions: ['user'],
            loginStyle: 'popup',
        });
    };

    return (
        <Button 
            variant="contained" 
            type="button" 
            onClick={handleGithubLogin} 
            startIcon={<GitHub />}
            fullWidth
            size="large"
            sx={{ 
                bgcolor: '#24292e', 
                color: 'white',
                '&:hover': { bgcolor: '#1a1e22' },
                py: 1.5
            }}
        >
            Continue with GitHub
        </Button>
    );
};