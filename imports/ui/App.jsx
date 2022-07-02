import React, {useState} from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { EventsCollection } from '/imports/db/EventsCollection';
import { EventForm } from './EventForm';
import { DateRangeForm } from "./DateRangeForm";
import {LoginForm} from "./LoginForm";
import {DateTime} from "luxon";
import { RRule } from 'rrule';
import {Header} from "./Header";
import {Box, Container, Grid} from "@mui/material";
import {DataGrid} from "@mui/x-data-grid";
import {Event} from "./Event";

const deleteEvent = ({ _id }) => Meteor.call('events.remove', _id);

export const App = () => {
    const [start, setStart] = useState(DateTime.now().startOf('day').toISODate());
    const [end, setEnd] = useState(DateTime.now().plus({ months: 1 }).endOf('day').toISODate());

    const money = (amt) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(amt)

    const user = useTracker(() => Meteor.user());
    const logout = () => Meteor.logout();

    const userFilter = user ? { userId: user._id } : {};

    const getCurrentEvents = () => {
        let filteredEvts = [];
        if (!user) return [];

        const handler = Meteor.subscribe('events');
        if (!handler.ready()) {
            return filteredEvts;
        }

        let evtsAll = EventsCollection.find(userFilter, {sort: {createdAt: -1}}).fetch();

        let running = 0.00;
        evtsAll.forEach(evt => {
            let betweenBegin = DateTime.fromISO(start).startOf('day').toJSDate();
            let betweenEnd = DateTime.fromISO(end).endOf('day').toJSDate();

            let rule = new RRule({
                wkst: RRule.SU,
                interval: evt.interval,
                freq: evt.frequency,
                byweekday: evt.weekdays,
                bysetpos: evt.dayOfMonth,
                byhour: 0,
                byminute: 0,
                bysecond: 0
            });

            rule.between(betweenBegin, betweenEnd, true).forEach((instance, idx) => {

                let dt = DateTime.fromJSDate(instance).setZone('utc');

                running = evt.type === 'bill' ? running - evt.amount : running + evt.amount;
                filteredEvts.push({
                    ...evt,
                    running: running,
                    listId: evt._id + idx,
                    timestamp: dt.toMillis(),
                    due: dt.toLocaleString(),
                    dueHuge: dt.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
                })
            })
        });

        filteredEvts.sort((a, b) => a.timestamp >= b.timestamp ? 1 : -1)
        return filteredEvts;
    };

    const evtsFlat = useTracker(() => getCurrentEvents());

    const columns = [
        {
            field: 'title',
            headerName: 'Title',
            editable: false,
        },
        {
            field: 'type',
            headerName: "Type",
            editable: false
        },
        {
            field: 'timestamp',
            headerName: 'Due',
            type: 'number',
            editable: false,
            sortable: true,
            valueFormatter: (ts) => DateTime.fromMillis(ts.value).toLocaleString()
        },
        {
            field: 'amount',
            headerName: 'Amount',
            editable: false,
            align: "right",
            valueFormatter: (amt) => money(amt.value)
        },
        {
            field: 'running',
            headerName: "Running",
            editable: false,
            align: "right",
            valueFormatter: (amt) => money(amt.value)
        },
        {
            field: 'actions',
            headerName: 'Actions',
            sortable: false,
            editable: false,
            renderCell: (actions) => <Edit evt={actions.row} onEditClick={editEvent} onDeleteClick={deleteEvent} />
        }
    ];

    return (
        <Container>
            <Header user={user} logout={logout} />
            { user ? (
                <Grid container spacing={2}>
                    <Grid item md={12}>
                        <DateRangeForm
                            start={start}
                            end={end}
                            setStart={setStart}
                            setEnd={setEnd}
                        />
                    </Grid>
                    <Grid item md={12}>
                        <Container>
                            <EventForm />
                        </Container>
                    </Grid>
                    <Grid item md={8}>
                        <Box sx={{ height: 400, width: '100%' }}>
                            <DataGrid columns={columns} rows={evtsFlat} pageSize={30} rowsPerPageOptions={[30]} getRowId={(row) => row.listId} />
                        </Box>
                    </Grid>

                    <Grid item md={4}>
                        Stuff here eventually
                    </Grid>


                </Grid>
            ) : (
                <LoginForm />
            )}
        </Container>
    );
};
