import React, {useState} from 'react';
import {useTracker} from 'meteor/react-meteor-data';
import {DateRangeForm} from "./DateRangeForm";
import {LoginForm} from "./login/LoginForm";
import {DateTime} from "luxon";
import {Header} from "./Header";
import {
    Box,
    Container,
    createTheme,
    Divider,
    FormControl,
    Grid, InputLabel,
    TextField,
    ThemeProvider,
    Typography
} from "@mui/material";
import {DataGrid} from "@mui/x-data-grid";
import EditEventBtnForm from "./event/EditEventBtnForm";



import columns from '../util/columnDef';
import defaultEvent from '../util/defaultEvent';
import getCurrentEvents from "../util/filterEvents";
import { deepPurple, teal } from '@mui/material/colors';
import {RunningChart} from "./RunningChart";


export const App = () => {
    const [start, setStart] = useState(DateTime.now().startOf('day').toISODate());
    const [end, setEnd] = useState(DateTime.now().plus({months: 1}).endOf('day').toISODate());
    const [balance, setBalance] = useState('');

    let income = 0;
    let expenses = 0;
    let series = [];

    const user = useTracker(() => Meteor.user());
    const logout = () => Meteor.logout();

    const evtsFlat = useTracker(() => getCurrentEvents(user, start, end, balance));
    if (evtsFlat.length) {
        expenses = evtsFlat.filter((i) => i.type === 'bill').map((i) => parseFloat(i.amount)).reduce((a, b) => a + b);
        income = evtsFlat.filter((i) => i.type === 'income').map((i) => parseFloat(i.amount)).reduce((a, b) => a + b);
        evtsFlat.map((i) => {
            series.push(parseFloat(i.running));
        });
    }

    const runningOptions = {
        chart: {id: 'runningChart'},
        plotOptions: {
            dataLabels: {
                enabled: false
            }
        },
        xaxis: {categories: evtsFlat.map((i, idx) => idx) }
    };

    const handleRunningChange = (e) => {
        setBalance(e.target.value);
    }

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
                            <Grid container md={12} justifyContent="flex-end">
                                <p>
                                    If you currently have a balance in your bank account or anything that is not already included as income, you can enter it here to give yourself a better idea of how your budget will play out over time.
                                </p>

                                <TextField fullWidth size="extra-large" label="running" onChange={handleRunningChange} value={balance} />

                                <Box marginTop={5} marginBottom={5} sx={{align: "right"}}>
                                    <Typography variant="h6" color="green">{income.toFixed(2)}</Typography>
                                    <Typography variant="h6" color="red">{expenses.toFixed(2)}</Typography>
                                    <Divider />
                                    <Typography variant="h6" color="grey">{(income - expenses).toFixed(2)}</Typography>
                                </Box>

                                <RunningChart options={runningOptions} series={series} />
                            </Grid>


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
