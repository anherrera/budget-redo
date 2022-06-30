import React from 'react';

import {FaPencilAlt} from "react-icons/all";
import {MdOutlineCancel} from "react-icons/all";
import {EventForm} from "./EventForm";

export const Event = ({ evt, onEditClick, onDeleteClick }) => {
    return (
        <li>
            <span>{evt.title}</span>
            <span>{evt.due}</span>
            <span>{evt.amount}</span>
            <button onClick={ () => onEditClick(evt) }><FaPencilAlt /></button>
            <button onClick={ () => onDeleteClick(evt) }><MdOutlineCancel /></button>
        </li>
    );
};