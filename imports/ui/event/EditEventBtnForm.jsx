import React, {useMemo, useReducer, useState} from 'react';
import {RRule, Weekday} from 'rrule'
import { FaPencilAlt } from 'react-icons/fa';
import { Meteor } from 'meteor/meteor';
import {
    Alert,
    Box,
    Button, Checkbox, Collapse, Container,
    Dialog,
    DialogTitle,
    Divider,
    FormControl, FormControlLabel, InputLabel, Link, MenuItem, Select, Snackbar, TextField, Tooltip, Typography
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
    const [showAdvanced, setShowAdvanced] = useState(false);

    const isEditingEvent = '_id' in event;

    const toggleEditing = (e) => {
        e.preventDefault();
        setFormData({reset: true})
        setShowAdvanced(false);
        setEditing(!isEditing);
    }

    const addEvent = (e) => {
        e.preventDefault();
        setResetEvent(defaultEvent);
        setFormData({reset: true});
        setShowAdvanced(false);
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

        if (name === 'type') {
            if (value === 'income' || value === 'cc_payment') {
                setFormData({ name: 'recurring', value: true });
            }
            if (value === 'income') {
                setFormData({ name: 'autoPay', value: false });
                setFormData({ name: 'variableAmount', value: false });
                setFormData({ name: 'statementDate', value: null });
            }
        }

        setFormData({
            name: name,
            value: isCheckbox ? checked : value,
        });
    }

    const rruleSummary = useMemo(() => {
        if (!formData.recurring) return null;
        try {
            let weekdaysArray = [];
            if (formData.weekdays) {
                const weekdayStr = Array.isArray(formData.weekdays) ? formData.weekdays.join(',') : String(formData.weekdays);
                weekdaysArray = weekdayStr !== "" ? weekdayStr.split(",").map((w) => Weekday.fromStr(w)) : [];
            }

            let ruleOpts = {
                dtstart: new Date(formData.startdate + 'T00:00:00'),
                wkst: RRule.SU,
                interval: parseInt(formData.interval) || 1,
                freq: formData.frequency,
                byweekday: weekdaysArray
            };

            if (formData.lastDayOfMonth === true || formData.setPos) {
                ruleOpts.bysetpos = formData.lastDayOfMonth ? -1 : parseInt(formData.setPos);
            }
            if (formData.until) {
                ruleOpts.until = new Date(formData.until + 'T00:00:00');
            }

            return new RRule(ruleOpts).toText();
        } catch {
            return null;
        }
    }, [formData.recurring, formData.frequency, formData.interval, formData.startdate, formData.setPos, formData.lastDayOfMonth, formData.weekdays, formData.weekdaysOnly, formData.until]);

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

                        {/* ── Details ── */}
                        <Divider sx={{ flexBasis: '100%' }} />
                        <Typography variant="overline">Details</Typography>

                        <TextField className="half" disabled={submitting} name="title" onChange={handleChange}
                                   value={formData.title} label="Title" required/>
                        <FormControl className="half" disabled={submitting}>
                            <InputLabel id="label-type">Type</InputLabel>
                            <Select labelId="label-type" name="type" value={formData.type} onChange={handleChange}
                                    label="Type">
                                <MenuItem value="bill">Bill</MenuItem>
                                <MenuItem value="income">Income</MenuItem>
                                <MenuItem value="cc_payment">Credit Card Payment</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField disabled={submitting} name="amount" value={formData.amount} type="number"
                                   onChange={handleChange} label="Amount" required/>
                        <TextField disabled={submitting} variant="filled"
                                   label={formData.recurring ? 'Starting on' : 'Date'} type="date" name="startdate" value={formData.startdate}
                                   onChange={handleChange} required InputLabelProps={{ shrink: true }}/>

                        {/* ── Payment (hidden for income) ── */}
                        <Collapse in={formData.type !== 'income'} sx={{ flexBasis: '100%' }}>
                            <Divider />
                            <Typography variant="overline" sx={{ display: 'block', mt: 1 }}>Payment</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '15px 2%', '& > *': { flexBasis: '100%' }, '& > .half': { flexBasis: '46%' } }}>
                                <FormControlLabel className="half" control={<Checkbox disabled={submitting} name="autoPay"
                                    checked={formData.autoPay} onChange={handleChange} />} label="Auto-pay" />

                                <Collapse in={formData.type === 'bill'} sx={{ flexBasis: '100%' }}>
                                    <FormControlLabel control={<Checkbox disabled={submitting} name="variableAmount"
                                        checked={!!formData.variableAmount} onChange={handleChange} />} label="Variable amount" />
                                </Collapse>

                                <Collapse in={formData.type === 'cc_payment' || (formData.type === 'bill' && !!formData.variableAmount)} sx={{ flexBasis: '100%' }}>
                                    <TextField
                                        fullWidth
                                        disabled={submitting}
                                        name="statementDate"
                                        value={formData.statementDate || ''}
                                        type="date"
                                        variant="filled"
                                        onChange={handleChange}
                                        label="Statement date"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Collapse>
                            </Box>
                        </Collapse>

                        {/* ── Schedule ── */}
                        <Divider sx={{ flexBasis: '100%' }} />
                        <Typography variant="overline">Schedule</Typography>

                        <FormControlLabel control={<Checkbox disabled={submitting} name="recurring"
                                                             checked={formData.recurring} onChange={handleChange}/>}
                                          label="Repeats"/>

                        <Collapse in={!!formData.recurring} sx={{ flexBasis: '100%' }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '15px 2%', '& > *': { flexBasis: '100%' }, '& > .half': { flexBasis: '46%' } }}>
                                <TextField className="half" disabled={submitting || !formData.recurring} name="interval"
                                           value={parseInt(formData.interval, 10) || 1} type="number" onChange={handleChange} label="Every" inputProps={{min: 1}}/>
                                <FormControl className="half" disabled={submitting || !formData.recurring}>
                                    <InputLabel id="label-frequency">Frequency</InputLabel>
                                    <Select name="frequency" value={formData.frequency} onChange={handleChange}
                                            label="Frequency">
                                        <MenuItem value={RRule.DAILY}>Days</MenuItem>
                                        <MenuItem value={RRule.WEEKLY}>Weeks</MenuItem>
                                        <MenuItem value={RRule.MONTHLY}>Months</MenuItem>
                                        <MenuItem value={RRule.YEARLY}>Years</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField className="half"
                                           name="until" variant="filled" value={formData.until} label="Until" type="date"
                                           onChange={handleChange}
                                           disabled={submitting || !formData.recurring}
                                           InputLabelProps={{ shrink: true }}
                                />

                                <Link
                                    component="button"
                                    type="button"
                                    variant="body2"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    sx={{ flexBasis: '100%', textAlign: 'left' }}
                                >
                                    {showAdvanced ? 'Hide advanced options' : 'Advanced options...'}
                                </Link>

                                <Collapse in={showAdvanced} sx={{ flexBasis: '100%' }}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '15px 2%', '& > *': { flexBasis: '100%' }, '& > .half': { flexBasis: '46%' } }}>
                                        <Collapse in={formData.frequency === RRule.MONTHLY} sx={{ flexBasis: '100%' }}>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '15px 2%', '& > .half': { flexBasis: '46%' } }}>
                                                <TextField className="half" name="setPos" value={parseInt(formData.setPos, 10) || 1} type="number"
                                                           onChange={handleChange} label="Day of month"
                                                           disabled={submitting || !formData.recurring || formData.lastDayOfMonth || formData.frequency !== RRule.MONTHLY} inputProps={{min: 1, max: 31}} />
                                                <FormControlLabel className="half" disabled={submitting || !formData.recurring || formData.frequency !== RRule.MONTHLY}
                                                                  control={<Checkbox name="lastDayOfMonth" checked={formData.lastDayOfMonth}
                                                                                     onChange={handleChange}/>} label="Last day of month"/>
                                            </Box>
                                        </Collapse>
                                        <FormControl className="half" disabled={submitting || !formData.recurring || formData.weekdaysOnly}>
                                            <InputLabel id="weekdays">Restrict to days</InputLabel>
                                            <Select name="weekdays" multiple value={formData.weekdays} onChange={handleChange}
                                                    label="Restrict to days">
                                                <MenuItem value={RRule.SU.toString()}>Sunday</MenuItem>
                                                <MenuItem value={RRule.MO.toString()}>Monday</MenuItem>
                                                <MenuItem value={RRule.TU.toString()}>Tuesday</MenuItem>
                                                <MenuItem value={RRule.WE.toString()}>Wednesday</MenuItem>
                                                <MenuItem value={RRule.TH.toString()}>Thursday</MenuItem>
                                                <MenuItem value={RRule.FR.toString()}>Friday</MenuItem>
                                                <MenuItem value={RRule.SA.toString()}>Saturday</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <FormControlLabel className="half" disabled={submitting || !formData.recurring} control={<Checkbox name="weekdaysOnly" checked={formData.weekdaysOnly} onChange={handleChange} />} label="Weekdays only" />
                                    </Box>
                                </Collapse>

                                {rruleSummary && (
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', flexBasis: '100%' }}>
                                        {rruleSummary}
                                    </Typography>
                                )}
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
