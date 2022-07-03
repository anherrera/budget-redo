import React, {useReducer, useState} from 'react';
import {RRule} from 'rrule'
import {FaPencilAlt} from "react-icons/all";
import {
    Button, Checkbox, Container,
    Dialog,
    DialogTitle,
    FormControl, FormControlLabel, FormHelperText, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField
} from "@mui/material";
import {DateTime} from "luxon";
import {ClearOutlined} from "@mui/icons-material";

const EditEventButton = ({event}) => {

    const [isEditing, setEditing] = useState(false);
    const [resetEvent, setResetEvent] = useState(event);
    const [submitting, setSubmitting] = useState(false);

    const isEditingEvent = '_id' in event;

    const toggleEditing = (e) => {
        e.preventDefault();
        setFormData({reset: true})
        setEditing(!isEditing);
    }

    const formReducer = (state, event) => {
        if (event.reset) {
            return resetEvent;
        }
        return {
            ...state,
            [event.name]: event.value
        }
    }

    const [formData, setFormData] = useReducer(formReducer, event);

    const handleChange = event => {
        const isCheckbox = event.target.type === 'checkbox';
        setFormData({
            name: event.target.name,
            value: isCheckbox ? event.target.checked : event.target.value,
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditingEvent) {
                await Meteor.call('events.edit', formData);
            } else {
                console.log(formData);
                await Meteor.call('events.insert', formData);
            }
            setSubmitting(false);
            setResetEvent(event)
            setEditing(false);
        } catch (err) {
            console.error(err);
            setSubmitting(false);
        }
    }


    return (
        <>
            {isEditingEvent ? (
                <button onClick={toggleEditing}>
                    <FaPencilAlt/>
                </button>
            ) : (
                <Button variant="contained" color="secondary" onClick={toggleEditing}>Add New Item</Button>
            )}
            <Dialog open={isEditing} onClose={toggleEditing}>

                <DialogTitle>{isEditingEvent ? `Editing ${event.title}` : 'Add Item'}</DialogTitle>

                <Container>
                    <form id="event-form" onSubmit={handleSubmit}>
                        <TextField className="half" disabled={submitting} name="title" onChange={handleChange}
                                   value={formData.title} label="title"/>
                        <FormControl className="half" disabled={submitting}>
                            <InputLabel id="label-type">type</InputLabel>
                            <Select labelId="label-type" name="type" value={formData.type} onChange={handleChange}
                                    label="type">
                                <MenuItem value="bill">Bill due</MenuItem>
                                <MenuItem value="income">Income</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField disabled={submitting} name="amount" value={formData.amount} type="number"
                                   onChange={handleChange} label="amount"/>
                        <TextField disabled={submitting || formData.recurring} className="half" variant="filled"
                                   label="on" type="date" name="startdate" value={formData.startdate}
                                   onChange={handleChange}/>

                        <FormControlLabel control={<Checkbox disabled={submitting} className="half" name="recurring"
                                                             checked={formData.recurring} onChange={handleChange}/>}
                                          label="or - recurring item?"/>

                        <TextField className="half" disabled={submitting || !formData.recurring} name="interval"
                                   value={formData.interval} type="number" onChange={handleChange} label="every"/>
                        <FormControl className="half" disabled={submitting || !formData.recurring}>
                            <InputLabel id="label-frequency">frequency</InputLabel>
                            <Select name="frequency" value={formData.frequency} onChange={handleChange}
                                    label="frequency">
                                <MenuItem value={RRule.DAILY}>Days</MenuItem>
                                <MenuItem value={RRule.WEEKLY}>Weeks</MenuItem>
                                <MenuItem value={RRule.MONTHLY}>Months</MenuItem>
                                <MenuItem value={RRule.YEARLY}>Years</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl className="half">
                            <TextField name="dayOfMonth" value={formData.dayOfMonth} type="number"
                                       onChange={handleChange} label="on the"
                                       disabled={submitting || !formData.recurring || formData.lastDayOfMonth}/>
                            <FormHelperText>-th day of the month</FormHelperText>
                        </FormControl>
                        <FormControlLabel className="half" disabled={submitting || !formData.recurring}
                                          control={<Checkbox name="lastDayOfMonth" checked={formData.lastDayOfMonth}
                                                             onChange={handleChange}/>} label="last day of the month"/>
                        <FormControl className="half" disabled={submitting || !formData.recurring}>
                            <InputLabel id="weekdays">weekdays</InputLabel>
                            <Select name="weekdays" multiple value={formData.weekdays} onChange={handleChange}
                                    label="weekdays">
                                <MenuItem value={RRule.SU.toString()}>Sunday</MenuItem>
                                <MenuItem value={RRule.MO.toString()}>Monday</MenuItem>
                                <MenuItem value={RRule.TU.toString()}>Tuesday</MenuItem>
                                <MenuItem value={RRule.WE.toString()}>Wednesday</MenuItem>
                                <MenuItem value={RRule.TH.toString()}>Thursday</MenuItem>
                                <MenuItem value={RRule.FR.toString()}>Friday</MenuItem>
                                <MenuItem value={RRule.SA.toString()}>Saturday</MenuItem>
                            </Select>
                            <FormHelperText>select M-F if it only occurs on weekdays</FormHelperText>
                        </FormControl>
                        <TextField className="half"
                                   name="until" variant="filled" value={formData.until} label="until" type="date"
                                   onChange={handleChange}
                                   disabled={submitting || !formData.recurring}
                        />

                        <Button fullWidth variant="contained" type="submit" disabled={submitting}>
                            Submit
                        </Button>
                    </form>
                </Container>
            </Dialog>
        </>
    )
}

export default EditEventButton;
