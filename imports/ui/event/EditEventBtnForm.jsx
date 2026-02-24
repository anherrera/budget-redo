import React, {useReducer, useState} from 'react';
import {RRule} from 'rrule'
import { FaPencilAlt } from 'react-icons/fa';
import { Meteor } from 'meteor/meteor';
import {
    Alert,
    Box,
    Button, Checkbox, Collapse, Container,
    Dialog,
    DialogTitle,
    FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, Select, Snackbar, TextField, Tooltip
} from "@mui/material";
import {Add} from "@mui/icons-material";
import defaultEvent from "../../util/defaultEvent";

const toFormEvent = (evt) => {
    const amount = evt.amount ?? (
        Number.isInteger(evt.amountCents) ? (evt.amountCents / 100).toFixed(2) : ''
    );
    return {
        ...evt,
        amount
    };
};

const EditEventButton = ({event}) => {
    const [isEditing, setEditing] = useState(false);
    const [resetEvent, setResetEvent] = useState(toFormEvent(event));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [timePeriod, setTimePeriod] = useState("month");

    const isEditingEvent = '_id' in event;

    const toggleEditing = (e) => {
        e.preventDefault();
        setFormData({reset: true})
        setEditing(!isEditing);
    }

    const addEvent = (e) => {
        e.preventDefault();
        setResetEvent(defaultEvent);
        setFormData({reset: true});
        setEditing(true);
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

    const [formData, setFormData] = useReducer(formReducer, toFormEvent(event));

    const handleChange = event => {
        const isCheckbox = event.target.type === 'checkbox';
        const { name, value, checked } = event.target;

        let time = timePeriod;

        if (name === 'frequency') {
            switch (value) {
                case RRule.MONTHLY:
                    time = "month";
                    break;
                case RRule.WEEKLY:
                    time = "week";
                    break;
                case RRule.YEARLY:
                    time = "year";
                    break;
                default:
                    time = "N/A";
            }
            setTimePeriod(time);
        }

        setFormData({
            name: name,
            value: isCheckbox ? checked : value,
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditingEvent) {
                await Meteor.callAsync('events.edit', formData);
            } else {
                await Meteor.callAsync('events.insertAsync', formData);
            }
            setSubmitting(false);
            setResetEvent(formData);
            setEditing(false);
        } catch (err) {
            console.error(err);
            setError(err.reason || 'Something went wrong');
            setSubmitting(false);
        }
    }


    return (
        <Box>
            <Box sx={{display: "flex", justifyContent: "right"}}>
                {isEditingEvent ? (
                    <Tooltip placement="top" arrow title="Edit item">
                        <Button variant="contained" color="secondary" onClick={toggleEditing}>
                            <FaPencilAlt/>
                        </Button>
                    </Tooltip>
                ) : (
                    <Button variant="contained" color="secondary" onClick={addEvent} endIcon={<Add />}>Add New Item</Button>
                )}
            </Box>

            <Dialog open={isEditing} onClose={toggleEditing}>

                <DialogTitle>{isEditingEvent ? `Editing ${event.title}` : 'Add Item'}</DialogTitle>

                <Container>
                    <form id="event-form" onSubmit={handleSubmit}>
                        <TextField className="half" disabled={submitting} name="title" onChange={handleChange}
                                   value={formData.title} label="Title" required/>
                        <FormControl className="half" disabled={submitting}>
                            <InputLabel id="label-type">type</InputLabel>
                            <Select labelId="label-type" name="type" value={formData.type} onChange={handleChange}
                                    label="type">
                                <MenuItem value="bill">Bill due</MenuItem>
                                <MenuItem value="income">Income</MenuItem>
                                <MenuItem value="cc_payment">Credit Card Payment</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField disabled={submitting} name="amount" value={formData.amount} type="number"
                                   onChange={handleChange} label="amount" required/>
                        <TextField disabled={submitting} variant="filled"
                                   label={formData.recurring ? 'starting on' : 'on'} type="date" name="startdate" value={formData.startdate}
                                   onChange={handleChange} required/>

                        {formData.type === 'bill' && (
                            <FormControlLabel control={<Checkbox disabled={submitting} name="variableAmount"
                                checked={!!formData.variableAmount} onChange={handleChange} />} label="Variable amount?" />
                        )}

                        {(formData.type === 'cc_payment' || (formData.type === 'bill' && formData.variableAmount)) && (
                            <TextField
                                disabled={submitting}
                                name="statementDate"
                                value={formData.statementDate || ''}
                                type="date"
                                variant="filled"
                                onChange={handleChange}
                                label="Due Date"
                            />
                        )}

                        <FormControlLabel control={<Checkbox disabled={submitting} className="half" name="autoPay"
                            checked={formData.autoPay} onChange={handleChange} />} label="automatic?" />

                        <FormControlLabel control={<Checkbox disabled={submitting} className="half" name="recurring"
                                                             checked={formData.recurring} onChange={handleChange}/>}
                                          label="recurring item?"/>

                        <Collapse in={!!formData.recurring}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '15px 2%' }}>
                                <TextField className="half" disabled={submitting || !formData.recurring} name="interval"
                                           value={parseInt(formData.interval, 10) || 1} type="number" onChange={handleChange} label="every" inputProps={{min: 1}}/>
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
                                <FormControl className="half" disabled={submitting || !formData.recurring || formData.frequency !== RRule.MONTHLY}>
                                    <TextField name="setPos" value={parseInt(formData.setPos, 10) || 1} type="number"
                                               onChange={handleChange} label="on the"
                                               disabled={submitting || !formData.recurring || formData.lastDayOfMonth || formData.frequency !== RRule.MONTHLY} inputProps={{min: 1, max: 31}} />
                                    <FormHelperText>-th day of the {timePeriod}</FormHelperText>
                                </FormControl>
                                <FormControlLabel className="half" disabled={submitting || !formData.recurring || formData.frequency !== RRule.MONTHLY}
                                                  control={<Checkbox name="lastDayOfMonth" checked={formData.lastDayOfMonth}
                                                                     onChange={handleChange}/>} label={"last day of the " + timePeriod}/>
                                <FormControl className="half" disabled={submitting || !formData.recurring || formData.weekdaysOnly}>
                                    <InputLabel id="weekdays">only falls on</InputLabel>
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
                                </FormControl>
                                <FormControlLabel disabled={submitting || !formData.recurring} control={<Checkbox name="weekdaysOnly" checked={formData.weekdaysOnly} onChange={handleChange} />} label={formData.frequency === RRule.MONTHLY ? "shift weekend to Friday" : "only falls M-F"} />
                                <TextField className="half"
                                           name="until" variant="filled" value={formData.until} label="until" type="date"
                                           placeholder=""
                                           onChange={handleChange}
                                           disabled={submitting || !formData.recurring}
                                />
                            </Box>
                        </Collapse>

                        <Button fullWidth variant="contained" type="submit" disabled={submitting}>
                            Submit
                        </Button>
                    </form>
                </Container>
            </Dialog>
            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Snackbar>
        </Box>
    )
}

export default EditEventButton;
