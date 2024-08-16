import React from 'react';
import { LoginWithGithub } from "./LoginWithGithub";
import { LoginWithGoogle } from "./LoginWithGoogle";
import { Container } from "@mui/material";

export const LoginForm = () => {
    return (
        <Container spacing={2} className="login-form">

            <LoginWithGithub />
            <br />
            <LoginWithGoogle />

        </Container>
    );
};
