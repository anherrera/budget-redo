import React from 'react';
import {Container, Tooltip} from "@mui/material";

export const Due = ({ evt }) => {
    return (
        <Tooltip title={evt.dueHuge}>
            <span className="monospace">{evt.due}</span>
        </Tooltip>
    )
}