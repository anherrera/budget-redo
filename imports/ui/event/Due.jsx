import React from 'react';
import {Container, Tooltip} from "@mui/material";

export const Due = ({ evt }) => {
    return (
        <Container>
            <Tooltip title={evt.dueHuge}>
                <span>{evt.due}</span>
            </Tooltip>
        </Container>
    )
}