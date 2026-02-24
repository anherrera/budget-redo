import React from 'react';
import { Meteor } from 'meteor/meteor';
import {Button} from "@mui/material";
import {Google} from "@mui/icons-material";

export const LoginWithGoogle = () => {
    const handleGoogleLogin = () => {
        Meteor.loginWithGoogle({
            loginStyle: 'popup',
        });
    };

    return (
        <Button
            variant="contained"
            type="button"
            onClick={handleGoogleLogin}
            startIcon={<Google />}
            fullWidth
            size="large"
            sx={{
                bgcolor: '#4285f4',
                color: 'white',
                borderRadius: 2,
                py: 1.5,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                    bgcolor: '#3367d6',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(66,133,244,0.4)',
                },
            }}
        >
            Continue with Google
        </Button>
    );
};
