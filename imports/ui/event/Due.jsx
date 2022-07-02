import {FaPencilAlt, MdOutlineCancel} from "react-icons/all";

import React, {useState} from 'react';
import {Container, Tooltip} from "@mui/material";
import {DateTime} from "luxon";

export const Due = ({ evt }) => {
    return (
        <Container>
            <Tooltip title={evt.dueHuge}>
                <span>{evt.due}</span>
            </Tooltip>
        </Container>
    )
}