import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import { LoginWithGithub } from "./LoginWithGithub";
import { LoginWithGoogle } from "./LoginWithGoogle";
import {Button, Container, FormControl, InputLabel, TextField} from "@mui/material";

export const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const submit = e => {
        e.preventDefault();

        Meteor.loginWithPassword(username, password);
    };

    return (
        <Container spacing={2}>
            <form onSubmit={submit} className="login-form">

                <LoginWithGithub />
                <br />
                <LoginWithGoogle />

                <FormControl margin="normal">
                    <InputLabel htmlFor="username">Username</InputLabel>

                    <TextField
                        type="text"
                        placeholder="Username"
                        name="username"
                        required
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </FormControl>

                <FormControl margin="normal">
                    <InputLabel htmlFor="password">Password</InputLabel>

                    <TextField
                        type="password"
                        placeholder="Password"
                        name="password"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </FormControl>

                <FormControl margin="normal">
                    <Button type="submit" variant="contained" color="secondary" sx={{padding: "10"}}>Log In</Button>
                </FormControl>
            </form>
        </Container>
    );
};