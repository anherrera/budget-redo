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
        <Button variant="outlined" type="button" className="github-btn" onClick={handleGithubLogin} endIcon={<GitHub size="large" />}>
            Login with Github
        </Button>
    );
};