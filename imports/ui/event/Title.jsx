import React from 'react';
import {Container, Tooltip} from "@mui/material";

export const Title = ({ evt }) => {
    return evt.autoPay === true ? (
        <span>{evt.title}</span>
    ) : (<strong>{evt.title}</strong>)
}