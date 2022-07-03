import React from 'react';
import {Container, Tooltip} from "@mui/material";

export const Due = ({ evt }) => {
    return (
        <Tooltip title={evt.dueHuge}>
            <span>{evt.due}</span>
        </Tooltip>
    )
}