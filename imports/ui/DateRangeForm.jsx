import React from 'react';
import {Button, ButtonGroup, Grid, TextField, Box} from "@mui/material";
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
        <Grid container spacing={2} alignItems="center">
            <Grid item md={6} xs={12}>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField 
                        variant="outlined" 
                        color="secondary" 
                        type="date" 
                        name="start" 
                        value={start} 
                        onChange={(e) => setStart(e.target.value)} 
                        label="Start Date" 
                        size="small"
                        sx={{ minWidth: 140 }}
                    />
                    <TextField 
                        variant="outlined" 
                        color="secondary" 
                        type="date" 
                        name="end" 
                        value={end} 
                        onChange={(e) => setEnd(e.target.value)} 
                        label="End Date" 
                        size="small"
                        sx={{ minWidth: 140 }}
                    />
                </Box>
            </Grid>
            <Grid item md={6} xs={12}>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                    <ButtonGroup variant="outlined" color="secondary" size="small">
                        <Button onClick={() => {setStart(thisMonthStart); setEnd(thisMonthEnd)}}>
                            This Month
                        </Button>
                        <Button onClick={() => {setStart(nextMonthStart); setEnd(nextMonthEnd)}}>
                            Next Month
                        </Button>
                        <Button onClick={() => {setStart(thisMonthStart); setEnd(nextNextMonthEnd)}}>
                            3 Months
                        </Button>
                    </ButtonGroup>
                </Box>
            </Grid>
        </Grid>
    );
};