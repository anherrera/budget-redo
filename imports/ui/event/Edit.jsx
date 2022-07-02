import {FaPencilAlt, MdOutlineCancel} from "react-icons/all";

import React, {useState} from 'react';
import {Container} from "@mui/material";

export const Edit = ({ evt, onEditClick, onDeleteClick}) => {
    return (evt.listId === evt._id + '0' ? (
        <Container>
            <button onClick={ () => onEditClick(evt) }><FaPencilAlt /></button>
            <button onClick={ () => onDeleteClick(evt) }><MdOutlineCancel /></button>
        </Container>
    ) : '')
}