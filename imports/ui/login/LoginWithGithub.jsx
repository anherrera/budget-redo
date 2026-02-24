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
                borderRadius: 2,
                py: 1.5,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    bgcolor: '#1a1e22',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(36,41,46,0.4)',
                },
            }}
        >
            Continue with GitHub
        </Button>
    );
};
