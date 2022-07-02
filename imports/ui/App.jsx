import React, {useState} from 'react';
import {useTracker} from 'meteor/react-meteor-data';
import {EventsCollection} from '/imports/db/EventsCollection';
import {EventForm} from './EventForm';
import {DateRangeForm} from "./DateRangeForm";
import {LoginForm} from "./LoginForm";
import {DateTime} from "luxon";
import {RRule, Weekday} from 'rrule';
import {Header} from "./Header";
import {Box, Container, Grid} from "@mui/material";
import {DataGrid} from "@mui/x-data-grid";
import {Edit} from "./event/Edit";
import {Due} from "./event/Due";

const deleteEvent = ({_id}) => Meteor.call('events.remove', _id);

export const App = () => {
    const [start, setStart] = useState(DateTime.now().startOf('day').toISODate());
    const [end, setEnd] = useState(DateTime.now().plus({months: 1}).endOf('day').toISODate());

    const money = (amt) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(amt)

    const user = useTracker(() => Meteor.user());
    const logout = () => Meteor.logout();

    const userFilter = user ? {userId: user._id} : {};

    const getCurrentEvents = () => {
        let filteredEvts = [];
        if (!user) return [];

        const handler = Meteor.subscribe('events');
        if (!handler.ready()) {
            return filteredEvts;
        }

        let evtsAll = EventsCollection.find(userFilter, {sort: {createdAt: -1}}).fetch();

        evtsAll.forEach(evt => {
            let betweenBegin = DateTime.fromISO(start).startOf('day').toJSDate();
            let betweenEnd = DateTime.fromISO(end).endOf('day').toJSDate();

            let weekdaysArray = evt.weekdays !== "" ? evt.weekdays.split(",").map((w) => Weekday.fromStr(w)) : [];

            let rule = new RRule({
                wkst: RRule.SU,
                interval: evt.interval,
                freq: evt.frequency,
                byweekday: weekdaysArray,
                bysetpos: evt.lastDayOfMonth ? -1 : evt.dayOfMonth,
                byhour: 0,
                byminute: 0,
                bysecond: 0
            });

            rule.between(betweenBegin, betweenEnd, true).forEach((instance, idx) => {
                let displayTime = DateTime.fromJSDate(instance).setZone('utc');
                filteredEvts.push({
                    ...evt,
                    listId: evt._id + idx,
                    timestamp: displayTime.toMillis(),
                    due: displayTime.toLocaleString(),
                    dueHuge: displayTime.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
                })
            })
        });

        filteredEvts.sort((a, b) => a.timestamp >= b.timestamp ? 1 : -1)

        let running = 0;
        filteredEvts.map((evt) => {
            if (evt.type === 'bill') {
                running -= parseFloat(evt.amount);
            } else {
                running += parseFloat(evt.amount);
            }
            evt.running = running;
        })

        return filteredEvts;
    };

    const evtsFlat = useTracker(() => getCurrentEvents());

    const columns = [
        {
            field: 'title',
            flex: 1,
            headerName: 'Title',
            editable: false,
        },
        {
            field: 'type',
            flex: 1,
            headerName: "Type",
            editable: false
        },
        {
            field: 'timestamp',
            flex: 1,
            headerName: 'Due',
            type: 'number',
            editable: false,
            sortable: true,
            renderCell: (ts) => <Due evt={ts.row}/>
        },
        {
            field: 'amount',
            flex: 1,
            headerName: 'Amount',
            editable: false,
            align: "right",
            valueFormatter: (amt) => money(amt.value)
        },
        {
            field: 'running',
            flex: 1,
            headerName: "Running",
            editable: false,
            align: "right",
            valueFormatter: (amt) => money(amt.value)
        },
        {
            field: 'actions',
            flex: 1,
            headerName: 'Actions',
            sortable: false,
            editable: false,
            renderCell: (actions) => <Edit evt={actions.row} onDeleteClick={deleteEvent}/>
        }
    ];

    return (
        <Container>
            <Grid container spacing={2}>
                {user ? (
                    <Grid container spacing={2}>
                        <Grid item md={12}>
                            <Header user={user} logout={logout}/>
                        </Grid>
                        <Grid item md={12}>
                            <DateRangeForm
                                start={start}
                                end={end}
                                setStart={setStart}
                                setEnd={setEnd}
                            />
                        </Grid>
                        <Grid item md={12}>
                            <EventForm/>
                        </Grid>
                        <Grid item md={8}>
                            <Box sx={{height: 700, width: '100%'}}>
                                <DataGrid columns={columns} rows={evtsFlat} pageSize={30} rowsPerPageOptions={[30]}
                                          getRowId={(row) => row.listId}/>
                            </Box>
                        </Grid>
                        <Grid item md={4}>
                            Stuff here eventually
                        </Grid>
                    </Grid>
                ) : (
                    <LoginForm/>
                )}
            </Grid>
        </Container>
    );
};
