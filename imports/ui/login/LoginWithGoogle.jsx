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
                '&:hover': { bgcolor: '#3367d6' },
                py: 1.5
            }}
        >
            Continue with Google
        </Button>
    );
};