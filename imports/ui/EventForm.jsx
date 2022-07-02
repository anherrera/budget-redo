import React, {useReducer, useState} from 'react';
import {RRule} from 'rrule'
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText, Grid,
    InputLabel,
    MenuItem, Select, TextField,
} from "@mui/material";


export const EventForm = () => {
    const formReducer = (state, event) => {
        if (event.reset) {
            return {
                type: 'bill',
                amount: 0,
                interval: 1,
                frequency: RRule.MONTHLY,
                dayOfMonth: 1,
                lastDayOfMonth: false,
                weekdays: []
            }
        }
        return {
            ...state,
            [event.name]: event.value
        }
    }

    const [formData, setFormData] = useReducer(formReducer, {
        type: 'bill',
        amount: 0,
        interval: 1,
        frequency: RRule.MONTHLY,
        dayOfMonth: 1,
        lastDayOfMonth: false,
        weekdays: []
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

        console.log(formData.type);

        Meteor.call('events.insert',
            formData.title,
            formData.type,
            parseFloat(formData.amount).toFixed(2),
            parseInt(formData.interval),
            formData.frequency,
            parseInt(formData.dayOfMonth),
            formData.lastDayOfMonth,
            formData.weekdays);

        setTimeout(() => {
            setFormData({
                reset: true
            })
            setSubmitting(false);
        }, 500)
    };

    return (
        <Box marginTop={4} marginBottom={4}>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item md={2}>
                        <TextField disabled={submitting} name="title" onChange={handleChange} value={formData.title || ''} label="title" />
                    </Grid>
                    <Grid item md={1}>
                        <FormControl fullWidth disabled={submitting}>
                            <InputLabel id="label-type">type</InputLabel>
                            <Select labelId="label-type" name="type" value={formData.type || 'bill'} onChange={handleChange} label="type">
                                <MenuItem value="bill">Bill due</MenuItem>
                                <MenuItem value="income">Income</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item md={1.25}>
                        <TextField disabled={submitting} name="amount" value={formData.amount || 0.00} type="number" onChange={handleChange} label="amount" />
                    </Grid>
                    <Grid item md={0.75}>
                        <TextField disabled={submitting} name="interval" value={formData.interval || 1} type="number" onChange={handleChange} label="every" />
                    </Grid>
                    <Grid item md={1.25}>
                        <FormControl fullWidth disabled={submitting}>
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
                        <FormControl disabled={submitting}>
                            <TextField name="dayOfMonth" value={formData.dayOfMonth || 1} type="number" onChange={handleChange} label="on the" disabled={formData.lastDayOfMonth} />
                            <FormHelperText>-th day</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item md={1.5}>
                        <FormControl disabled={submitting} fullWidth>
                            <InputLabel id="weekdays">weekdays</InputLabel>
                            <Select name="weekdays" multiple value={formData.weekdays || []} onChange={handleChange} label="weekdays">
                                <MenuItem value={RRule.SU}>Sunday</MenuItem>
                                <MenuItem value={RRule.MO}>Monday</MenuItem>
                                <MenuItem value={RRule.TU}>Tuesday</MenuItem>
                                <MenuItem value={RRule.WE}>Wednesday</MenuItem>
                                <MenuItem value={RRule.TH}>Thursday</MenuItem>
                                <MenuItem value={RRule.FR}>Friday</MenuItem>
                                <MenuItem value={RRule.SA}>Saturday</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item md={1.5}>
                        <FormControlLabel disabled={submitting} control={<Checkbox name="lastDayOfMonth" checked={formData.lastDayOfMonth || false} onChange={handleChange} />} label="last day of the month" />
                    </Grid>
                    <Grid item md={1}>
                        <Button variant="contained" type="submit" disabled={submitting}>Add</Button>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};
