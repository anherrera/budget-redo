import React, {useState} from 'react';
import {useTracker} from 'meteor/react-meteor-data';
import {DateRangeForm} from "./DateRangeForm";
import {LoginForm} from "./login/LoginForm";
import {DateTime} from "luxon";
import {Header} from "./Header";
import {Box, Container, createTheme, Grid, ThemeProvider} from "@mui/material";
import {DataGrid} from "@mui/x-data-grid";
import EditEventBtnForm from "./event/EditEventBtnForm";

import columns from '../util/columnDef';
import defaultEvent from '../util/defaultEvent';
import getCurrentEvents from "../util/filterEvents";
import { deepPurple, teal } from '@mui/material/colors';


export const App = () => {
    const [start, setStart] = useState(DateTime.now().startOf('day').toISODate());
    const [end, setEnd] = useState(DateTime.now().plus({months: 1}).endOf('day').toISODate());

    const user = useTracker(() => Meteor.user());
    const logout = () => Meteor.logout();

    const evtsFlat = useTracker(() => getCurrentEvents(user, start, end));

    const theme = createTheme({
        palette: {
            primary: {
                main: deepPurple[500],
            },
            secondary: {
                main: teal[500]
            },
        },
    });

    return (
        <ThemeProvider theme={theme}>
        <Container>
            <Grid container spacing={2}>
                {user ? (
                    <Grid container spacing={2}>
                        <Grid item md={12}>
                            <Header user={user} logout={logout}/>
                        </Grid>
                        <Grid item md={8} xs={12}>
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
                                    <EditEventBtnForm event={defaultEvent} />
                                </Grid>
                                <Grid item md={12}>
                                    <Box sx={{height: 700, width: '100%'}}>
                                        <DataGrid columns={columns} rows={evtsFlat} pageSize={30} rowsPerPageOptions={[30]}
                                                  getRowId={(row) => row.listId}/>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item md={4} xs={12}>
                            Stuff here eventually
                        </Grid>
                    </Grid>
                ) : (
                    <LoginForm/>
                )}
            </Grid>
        </Container>
        </ThemeProvider>
    );
};
