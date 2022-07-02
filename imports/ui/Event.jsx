import React from 'react';

import {FaPencilAlt} from "react-icons/all";
import {MdOutlineCancel} from "react-icons/all";
import {EventForm} from "./EventForm";
import EditEventButton from "./EditEventBtnForm";

export const Event = ({ evt, onDeleteClick }) => {
    return (
        <li>
            <span>{evt.title}</span>
            <span>{evt.due}</span>
            <span>{evt.amount}</span>
            <EditEventButton event={evt}/>
            {/*<button onClick={ () => onDeleteClick(evt) }><MdOutlineCancel /></button>*/}
        </li>
    );
};
