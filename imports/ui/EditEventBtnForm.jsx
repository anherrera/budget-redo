import React, {useReducer, useState} from 'react';
import {RRule} from 'rrule'
import {FaPencilAlt} from "react-icons/all";
import {
  Button, Checkbox,
  Dialog,
  DialogTitle,
  FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, Select, TextField
} from "@mui/material";

const EditEventButton = ({event}) => {
  const [isEditing, setEditing] = useState(false);
  const [resetEvent, setResetEvent] = useState(event);
  const [submitting, setSubmitting] = useState(false);


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
      await Meteor.call('events.edit', formData);
      setSubmitting(false);
      setResetEvent(formData)
      setEditing(false);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }


  return (
    <>
      <button onClick={toggleEditing}>
        <FaPencilAlt />
      </button>
      <Dialog open={isEditing} onClose={toggleEditing}>

        <DialogTitle>{`Editing ${event.title}`}</DialogTitle>

        <form onSubmit={handleSubmit}>
          <TextField disabled={submitting} name="title" onChange={handleChange} value={formData.title || ''} label="title" />
          <InputLabel id="label-type">type</InputLabel>
          <FormControl fullWidth disabled={submitting}>
            <InputLabel id="label-type">type</InputLabel>
            <Select labelId="label-type" name="type" value={formData.type || ''} onChange={handleChange} label="type">
              <MenuItem value="bill">Bill due</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </Select>
          </FormControl>
          <TextField disabled={submitting} name="amount" value={formData.amount || '0.00'} type="number" onChange={handleChange} label="amount" />
          <TextField disabled={submitting} name="interval" value={formData.interval || 1} type="number" onChange={handleChange} label="every" />
          <FormControl fullWidth disabled={submitting}>
            <InputLabel id="label-frequency">frequency</InputLabel>
            <Select name="frequency" value={formData.frequency || RRule.MONTHLY} onChange={handleChange} label="frequency">
              <MenuItem value={RRule.DAILY}>Days</MenuItem>
              <MenuItem value={RRule.WEEKLY}>Weeks</MenuItem>
              <MenuItem value={RRule.MONTHLY}>Months</MenuItem>
              <MenuItem value={RRule.YEARLY}>Years</MenuItem>
            </Select>
          </FormControl>
          <FormControl disabled={submitting}>
            <TextField name="dayOfMonth" value={formData.dayOfMonth || 1} type="number" onChange={handleChange} label="on the" disabled={formData.lastDayOfMonth} />
            <FormHelperText>-th day</FormHelperText>
          </FormControl>
          <FormControlLabel disabled={submitting} control={<Checkbox name="lastDayOfMonth" checked={formData.lastDayOfMonth || false} onChange={handleChange} />} label="last day of the month" />
          <FormControlLabel disabled={submitting} control={<Checkbox name="weekdaysOnly" checked={formData.weekdaysOnly || false} onChange={handleChange} />} label={"only on weekdays"} />
          <Button variant="contained" type="submit" disabled={submitting}>Submit Changes</Button>

        </form>

      </Dialog>
    </>
  )
}

export default EditEventButton;
