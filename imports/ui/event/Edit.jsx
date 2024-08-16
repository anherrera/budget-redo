import { MdOutlineCancel} from "react-icons/md";

import React from 'react';
import {Box, Button, Tooltip} from "@mui/material";
import EditEventBtnForm from "./EditEventBtnForm";

export const Edit = ({ evt, onDeleteClick}) => {
    return (evt.listId === evt._id + '0' ? (
        <Box sx={{width: '100%', display: "flex", gap: '10px', justifyContent: 'center'}}>
            <EditEventBtnForm event={evt} />
            <Tooltip arrow title="Delete item" placement="top">
                <Button variant="contained" color="error" onClick={ () => onDeleteClick(evt) }><MdOutlineCancel /></Button>
            </Tooltip>
        </Box>
    ) : '')
}
