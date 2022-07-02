import {FaPencilAlt, MdOutlineCancel} from "react-icons/all";

import React, {useState} from 'react';
import {Container} from "@mui/material";
import EditEventBtnForm from "../EditEventBtnForm";

export const Edit = ({ evt, onDeleteClick}) => {
    return (evt.listId === evt._id + '0' ? (
        <Container>
            <EditEventBtnForm event={evt} />
            <button onClick={ () => onDeleteClick(evt) }><MdOutlineCancel /></button>
        </Container>
    ) : '')
}