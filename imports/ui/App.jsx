import React, {useEffect, useState, useMemo, useCallback} from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import {DateRangeForm} from "./DateRangeForm";
import {LoginForm} from "./login/LoginForm";
import {DateTime} from "luxon";
import {Header} from "./Header";
import {
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    CssBaseline,
    ThemeProvider,
    useMediaQuery
} from "@mui/material";
import {CalendarMonth, ReceiptLong, TrendingUp} from "@mui/icons-material";
import {DataGrid} from "@mui/x-data-grid";
import EditEventBtnForm from "./event/EditEventBtnForm";

import columns, {compactColumns} from '../util/columnDef';
import defaultEvent from '../util/defaultEvent';
import getCurrentEvents from "../util/filterEvents";
import {summarizeEvents} from "../util/summarizeEvents";
import {balanceStatus} from "../util/balanceStatus";
import {RunningChart} from "./RunningChart";
import {runningChartOptions} from "./runningChartOptions";
import {AccentBar, SectionTitle} from "./Section";
import {BalanceCard} from "./BalanceCard";
import {SummaryCard} from "./SummaryCard";
import {getTheme} from "./theme";

const rowClass = (record) => record.row.skipped ? 'skipped' : balanceStatus(record.row.running);

// Two columns from md up. Below that the column wrappers dissolve
// (display: contents) and the cards stack in the order given by `order`, so the
// balance and summary come before the long transactions grid.
const columnSx = { display: { xs: 'contents', md: 'flex' }, flexDirection: 'column', gap: 2, minWidth: 0 };
const slot = (order) => ({ order: { xs: order, md: 0 }, minWidth: 0 });

export const App = () => {
    const [start, setStart] = useState(DateTime.now().startOf('day').toISODate());
    const [end, setEnd] = useState(DateTime.now().plus({months: 1}).endOf('day').toISODate());
    const [balance, setBalance] = useState('');
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    const { user, loggingIn } = useTracker(() => ({
        user: Meteor.user(),
        loggingIn: Meteor.loggingIn(),
    }));
    const logout = () => Meteor.logout();

    const { events: evtsFlat, loading } = useTracker(() => getCurrentEvents(user, start, end, balance));

    const { income, expenses, series, min, minDate, max, chartCategories } = useMemo(() => summarizeEvents(evtsFlat), [evtsFlat]);

    const runningOptions = useMemo(
        () => runningChartOptions({darkMode, chartCategories, min}),
        [darkMode, chartCategories, min]
    );

    // Save theme preference and update document
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        document.documentElement.setAttribute('data-mui-color-scheme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => !prev);
    }, []);

    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    // Phones get two-line rows; between sm and md only the Type column is dropped.
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
    const isSmall = useMediaQuery(theme.breakpoints.down('md'));
    const [columnVisibility, setColumnVisibility] = useState({});
    useEffect(() => {
        setColumnVisibility({type: !isSmall});
    }, [isSmall]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{
                bgcolor: 'background.default',
                minHeight: '100vh',
                py: 1.5,
                background: darkMode
                    ? `radial-gradient(ellipse at 10% 0%, rgba(103,58,183,0.10) 0%, transparent 50%), ${theme.palette.background.default}`
                    : `radial-gradient(ellipse at 10% 0%, rgba(103,58,183,0.06) 0%, transparent 50%), ${theme.palette.background.default}`,
            }}>
                <Container maxWidth="xl">
                    {loggingIn ? null : user ? (
                        <>
                            <Header user={user} logout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode}/>
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 3fr) minmax(0, 1fr)' },
                                gap: 2,
                                alignItems: 'start',
                            }}>
                                <Box sx={columnSx}>
                                    <Box sx={slot(3)}>
                                        <Card>
                                            <AccentBar gradient={theme.palette.gradient.secondary} />
                                            <CardContent sx={{ py: 2 }}>
                                                <SectionTitle icon={<CalendarMonth fontSize="small" color="secondary" />} title="Date Range" />
                                                <Box sx={{ mt: 1.5 }}>
                                                    <DateRangeForm
                                                        start={start}
                                                        end={end}
                                                        setStart={setStart}
                                                        setEnd={setEnd}
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Box>
                                    <Box sx={slot(4)}>
                                        <Card>
                                            <AccentBar gradient={theme.palette.gradient.primary} />
                                            <CardContent sx={{ p: 0 }}>
                                                <Box sx={{
                                                    p: 1.5,
                                                    borderBottom: '1px solid',
                                                    borderColor: 'divider',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    background: darkMode
                                                        ? 'linear-gradient(180deg, rgba(103,58,183,0.08) 0%, transparent 100%)'
                                                        : 'linear-gradient(180deg, rgba(103,58,183,0.04) 0%, transparent 100%)',
                                                }}>
                                                    <SectionTitle
                                                        icon={<ReceiptLong fontSize="small" color="primary" />}
                                                        title="Transactions"
                                                        chip={evtsFlat.length > 0 ? <Chip label={evtsFlat.length} size="small" color="primary" variant="filled" sx={{ height: 20, fontSize: '0.7rem' }} /> : null}
                                                    />
                                                    <EditEventBtnForm event={defaultEvent} />
                                                </Box>
                                                <Box sx={{height: '70vh', width: '100%', minHeight: 400}}>
                                                    {loading ? (
                                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                            <CircularProgress />
                                                        </Box>
                                                    ) : (
                                                        <DataGrid
                                                            getRowClassName={rowClass}
                                                            columns={isPhone ? compactColumns : columns}
                                                            columnVisibilityModel={columnVisibility}
                                                            onColumnVisibilityModelChange={setColumnVisibility}
                                                            rowHeight={isPhone ? 60 : 52}
                                                            rows={evtsFlat}
                                                            initialState={{
                                                                pagination: {
                                                                    paginationModel: { pageSize: 100, page: 0 }
                                                                }
                                                            }}
                                                            pageSizeOptions={[100]}
                                                            getRowId={(row) => row.listId}
                                                        />
                                                    )}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Box>
                                </Box>
                                <Box sx={columnSx}>
                                    <Box sx={slot(1)}>
                                        <BalanceCard user={user} onBalance={setBalance} gradient={theme.palette.gradient.hero} />
                                    </Box>
                                    <Box sx={slot(2)}>
                                        <SummaryCard
                                            income={income} expenses={expenses}
                                            min={min} minDate={minDate} max={max}
                                            darkMode={darkMode} gradient={theme.palette.gradient.primary}
                                        />
                                    </Box>
                                    {evtsFlat.length > 0 && (
                                        <Box sx={slot(5)}>
                                            <Card>
                                                <AccentBar gradient={theme.palette.gradient.primary} />
                                                <CardContent sx={{ py: 2 }}>
                                                    <SectionTitle icon={<TrendingUp fontSize="small" color="primary" />} title="Balance Trend" />
                                                    <Box sx={{ mt: 1 }}>
                                                        <RunningChart options={runningOptions} series={series} />
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '80vh',
                        }}>
                            <Card sx={{
                                maxWidth: 420,
                                width: '100%',
                                border: '1px solid',
                                borderColor: darkMode ? 'rgba(103,58,183,0.3)' : 'rgba(103,58,183,0.15)',
                            }}>
                                <AccentBar gradient={theme.palette.gradient.hero} />
                                <CardContent>
                                    <LoginForm/>
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </Container>
            </Box>
        </ThemeProvider>
    );
};
