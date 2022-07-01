import React, {useReducer, useState} from 'react';
import {RRule} from 'rrule'
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup, FormHelperText, Grid,
    InputLabel,
    MenuItem, Select, TextField,
} from "@mui/material";
import {CgInpicture} from "react-icons/all";


export const EventForm = (evtObj) => {
    const formReducer = (state, event) => {
        return {
            ...state,
            [event.name]: event.value
        }
    }

    const [formData, setFormData] = useReducer(formReducer, {
        interval: 1,
        frequency: RRule.MONTHLY,
        dayOfMonth: 1,
        lastDayOfMonth: false,
        weekdaysOnly: false
    });
    const [submitting, setSubmitting] = useState(false);


    const handleChange = event => {
        const isCheckbox = event.target.type === 'checkbox';
        setFormData({
            name: event.target.name,
            value: isCheckbox ? event.target.checked : event.target.value,
        });
    }

    const handleSubmit = e => {
        e.preventDefault();
        setSubmitting(true);

        console.log(formData);

        Meteor.call('events.insert', formData.title, formData.type, formData.amount, formData.interval, formData.frequency, formData.dayOfMonth, formData.lastDayOfMonth, formData.weekdaysOnly);

        setTimeout(() => {
            setSubmitting(false);
        }, 3000)
    };

    return (
        <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                <Grid item md={2}>
                    <TextField name="title" onChange={handleChange} value={formData.title || ''} label="title" />
                </Grid>
                <Grid item md={1}>
                    <FormControl fullWidth>
                        <InputLabel id="label-type">type</InputLabel>
                        <Select labelId="label-type" name="type" value={formData.type || ''} onChange={handleChange} label="type">
                            <MenuItem value="bill">Bill due</MenuItem>
                            <MenuItem value="income">Income</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item md={1.25}>
                    <TextField name="amount" value={formData.amount || '0.00'} type="number" onChange={handleChange} label="amount" />
                </Grid>
                <Grid item md={0.75}>
                    <TextField name="interval" value={formData.interval || 1} type="number" onChange={handleChange} label="every" />
                </Grid>
                <Grid item md={1.25}>
                    <FormControl fullWidth>
                        <InputLabel id="label-frequency">frequency</InputLabel>
                        <Select name="frequency" value={formData.frequency || RRule.MONTHLY} onChange={handleChange} label="frequency">
                            <MenuItem value={RRule.DAILY}>Days</MenuItem>
                            <MenuItem value={RRule.WEEKLY}>Weeks</MenuItem>
                            <MenuItem value={RRule.MONTHLY}>Months</MenuItem>
                            <MenuItem value={RRule.YEARLY}>Years</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item md={1}>
                    <FormControl>
                        <TextField name="dayOfMonth" value={formData.dayOfMonth || 1} type="number" onChange={handleChange} label="on the" />
                        <FormHelperText>-th day</FormHelperText>
                    </FormControl>
                </Grid>
                <Grid item md={1.5}>
                    <FormControlLabel control={<Checkbox name="lastDayOfMonth" checked={formData.lastDayOfMonth || false} onChange={handleChange} />} label="last day of the month" />
                </Grid>
                <Grid item md={1.5}>
                    <FormControlLabel control={<Checkbox name="weekdaysOnly" checked={formData.weekdaysOnly || false} onChange={handleChange} />} label={"only on weekdays"} />
                </Grid>
                <Grid item md={1}>
                    <Button variant="contained" type="submit">Add Event</Button>
                </Grid>
            </Grid>
        </form>
    );
};