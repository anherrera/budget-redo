import React, {useState} from 'react';
import {RRule} from 'rrule'
import {
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup, FormHelperText,
    InputLabel,
    MenuItem, Select, TextField,
} from "@mui/material";
import {CgInpicture} from "react-icons/all";

export const EventForm = ({ event }) => {
    const [title, setTitle] = useState(event.title);
    const [eventType, setEventType] = useState(event.type);
    const [amount, setAmount] = useState(event.amount);
    const [interval, setEventInterval] = useState(event.rule ? event.rule.interval : 1);
    const [frequency, setFrequency] = useState(event.rule ? event.rule.freq : RRule.MONTHLY);
    const [dayOfMonth, setDayOfMonth] = useState(event.rule ? event.rule.bymonthday : 1);
    const [weekdaysOnly, setWeekdaysOnly] = useState(event.rule ? event.rule.byweekday != null : false);

    const handleSubmit = e => {
        e.preventDefault();

        Meteor.call('events.insert', title, eventType, amount, interval, frequency, dayOfMonth, weekdaysOnly);

        setTitle("");
        setEventType("");
        setAmount(0);
        setFrequency(RRule.MONTHLY);
        setDayOfMonth(1);
        setWeekdaysOnly(false);
    };

    return (
        <form className="event-form" onSubmit={handleSubmit}>

            <FormControl>
                <InputLabel>title</InputLabel>
                <TextField value={title} onChange={(e)=> setTitle(e.target.value)} />
            </FormControl>

            <FormControl>
                <InputLabel>type</InputLabel>
                <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                    <MenuItem vaue=""></MenuItem>
                    <MenuItem value="bill">Bill due</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                </Select>
            </FormControl>

            <FormControl>
                <InputLabel>amount</InputLabel>
                <TextField value={amount} type="number" />
            </FormControl>

            <FormControl>
                <InputLabel>every</InputLabel>
                <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                    <MenuItem value={RRule.DAILY}>Days</MenuItem>
                    <MenuItem value={RRule.WEEKLY}>Weeks</MenuItem>
                    <MenuItem value={RRule.DAILY}>Months</MenuItem>
                    <MenuItem value={RRule.YEARLY}>Years</MenuItem>
                </Select>
            </FormControl>
            
            <FormControl>
                <InputLabel>day of the month</InputLabel>
                <TextField value={dayOfMonth} type="number" />
            </FormControl>

            <FormControl>
                <FormControlLabel control={<Checkbox checked={dayOfMonth === -1} />} label="last day of the month" />

                <FormHelperText>disables day of month</FormHelperText>
            </FormControl>


            <FormControl>
                <InputLabel>only on weekdays</InputLabel>
                <Checkbox checked={weekdaysOnly} />
            </FormControl>

            <Button variant="contained" type="submit">Add Event</Button>
        </form>
    );
};