import React from 'react';
import { Meteor } from 'meteor/meteor';
import {Button} from "@mui/material";
import {Google} from "@mui/icons-material";

export const LoginWithGoogle = () => {
    const handleGoogleLogin = () => {
        Meteor.loginWithGoogle({
            requestPermissions: ['user'],
            loginStyle: 'popup',
        });
    };

    return (
        <Button variant="outlined" type="button" className="google-btn" onClick={handleGoogleLogin} endIcon={<Google size="large" />}>
            Login with Google
        </Button>
    );
};