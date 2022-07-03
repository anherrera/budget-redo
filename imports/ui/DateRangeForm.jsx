import React from 'react';
import {Button, Grid, TextField} from "@mui/material";
import {DateTime} from "luxon";
export const DateRangeForm = ({start, end, setStart, setEnd}) => {
    const thisMonthStart = DateTime.now().startOf('month').toISODate();
    const thisMonthEnd = DateTime.now().endOf('month').toISODate();
    const nextMonthStart = DateTime.now().plus({months: 1}).startOf('month').toISODate();
    const nextMonthEnd = DateTime.now().plus({months: 1}).endOf('month').toISODate();
    const nextNextMonthEnd = DateTime.now().plus({months: 2}).endOf('month').toISODate();

    const handleSubmit = e => {
        e.preventDefault();

        if (!start) return;
        if (!end) return;

        setStart(start);
        setEnd(end);
    };

    return (
        <Grid container spacing={2}>
            <Grid item md={6} xs={12}>
                <form onSubmit={handleSubmit}>
                    <TextField variant="filled" color="secondary" type="date" name="start" value={start} onChange={(e) => setStart(e.target.value)} label="start" />
                    &nbsp;&nbsp;
                    <TextField variant="filled" color="secondary" type="date" name="end" value={end} onChange={(e) => setEnd(e.target.value)} label="end" />
                </form>
            </Grid>
            <Grid item md={6} xs={12} display="flex" alignItems="left" sx={{justifyContent: "center"}}>
                <Button variant="text" onClick={() => {setStart(thisMonthStart); setEnd(thisMonthEnd)}}>This month</Button>
                <Button variant="text" onClick={() => {setStart(nextMonthStart); setEnd(nextMonthEnd)}}>Next month</Button>
                <Button variant="text" onClick={() => {setStart(thisMonthStart); setEnd(nextNextMonthEnd)}}>3 months</Button>
            </Grid>
        </Grid>
    );
};