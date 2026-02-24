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
    Divider,
    Grid,
    TextField,
    ThemeProvider,
    Typography
} from "@mui/material";
import {
    CalendarMonth,
    ReceiptLong,
    AccountBalance,
    TrendingUp,
} from "@mui/icons-material";
import {DataGrid} from "@mui/x-data-grid";
import EditEventBtnForm from "./event/EditEventBtnForm";

import columns from '../util/columnDef';
import defaultEvent from '../util/defaultEvent';
import getCurrentEvents from "../util/filterEvents";
import { deepPurple, teal } from '@mui/material/colors';
import {RunningChart} from "./RunningChart";
import {getTheme} from "./theme";


export const App = () => {
    const [start, setStart] = useState(DateTime.now().startOf('day').toISODate());
    const [end, setEnd] = useState(DateTime.now().plus({months: 1}).endOf('day').toISODate());
    const [balance, setBalance] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [debounceTimer, setDebounceTimer] = useState(null);
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
    
    const { income, expenses, series, min, max, chartCategories } = useMemo(() => {
        if (!evtsFlat.length) {
            return { income: 0, expenses: 0, series: [], min: undefined, max: undefined, chartCategories: [] };
        }
        
        let totalIncomeCents = 0;
        let totalExpensesCents = 0;
        let minVal, maxVal;
        
        // Group by date and get the final running total for each date
        const dailyRunning = new Map();
        
        evtsFlat.forEach((i) => {
            const amountCents = Number.isInteger(i.amountCents)
                ? i.amountCents
                : Math.round((parseFloat(i.amount) || 0) * 100);
            if (i.type === 'bill') {
                totalExpensesCents += amountCents;
            } else if (i.type === 'income') {
                totalIncomeCents += amountCents;
            } else if (i.type === 'cc_payment') {
                totalExpensesCents += amountCents;
            }
            
            const running = parseFloat(i.running);
            const date = i.due; // Use the formatted date string
            
            // Calculate min/max from ALL running totals
            if (minVal === undefined) minVal = running;
            if (maxVal === undefined) maxVal = running;
            minVal = running < minVal ? running : minVal;
            maxVal = running > maxVal ? running : maxVal;
            
            // Keep the last running total for each date (for the chart)
            dailyRunning.set(date, running);
        });
        
        // Convert to arrays sorted by date
        const sortedEntries = Array.from(dailyRunning.entries()).sort((a, b) => 
            new Date(a[0]) - new Date(b[0])
        );
        
        const chartSeries = sortedEntries.map(([date, running]) => running);
        const chartCategories = sortedEntries.map(([date, running]) => date);
        
        return {
            income: totalIncomeCents / 100,
            expenses: totalExpensesCents / 100,
            series: chartSeries,
            min: minVal,
            max: maxVal,
            chartCategories
        };
    }, [evtsFlat]);

    const runningOptions = useMemo(() => ({
        chart: {
            id: 'runningChart',
            background: 'transparent',
            toolbar: { show: false },
            dropShadow: {
                enabled: true,
                top: 3,
                left: 0,
                blur: 6,
                color: darkMode ? deepPurple[300] : deepPurple[500],
                opacity: 0.25,
            },
        },
        theme: {
            mode: darkMode ? 'dark' : 'light',
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 90, 100],
                colorStops: [{
                    offset: 0,
                    color: darkMode ? deepPurple[300] : deepPurple[500],
                    opacity: 0.4,
                }, {
                    offset: 100,
                    color: darkMode ? deepPurple[300] : deepPurple[500],
                    opacity: 0.02,
                }],
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: chartCategories,
            type: 'datetime',
            labels: {
                rotate: -45,
                style: {
                    fontSize: '10px',
                    fontFamily: '"Inter", sans-serif',
                    colors: darkMode ? '#bdbdbd' : '#616161',
                },
            },
            axisBorder: { show: false },
        },
        yaxis: {
            min: min < 0 ? min : 0,
            labels: {
                formatter: (val) => `$${val?.toLocaleString() ?? '0'}`,
                style: {
                    fontSize: '11px',
                    fontFamily: '"JetBrains Mono", monospace',
                    colors: darkMode ? '#bdbdbd' : '#616161',
                },
            },
        },
        grid: {
            borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            strokeDashArray: 4,
        },
        stroke: {
            curve: 'smooth',
            width: 2.5,
            colors: [darkMode ? deepPurple[300] : deepPurple[500]],
        },
        markers: {
            size: 0,
            hover: { size: 5 },
        },
        tooltip: {
            y: {
                formatter: (val) => `$${val?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`,
            },
        },
        annotations: min < 0 ? {
            yaxis: [{
                y: 0,
                borderColor: darkMode ? '#ef5350' : '#d32f2f',
                strokeDashArray: 3,
                label: {
                    text: 'Zero',
                    style: {
                        color: '#fff',
                        background: darkMode ? '#ef5350' : '#d32f2f',
                        fontSize: '10px',
                    },
                },
            }],
        } : {},
    }), [darkMode, chartCategories, min]);

    const evaluateMath = useCallback((expression) => {
        try {
            // Only allow numbers, +, -, *, /, (, ), and whitespace
            if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
                return expression;
            }
            // Use Function constructor for safe evaluation
            const result = Function('"use strict"; return (' + expression + ')')();
            return isNaN(result) ? expression : result.toString();
        } catch {
            return expression;
        }
    }, []);

    const handleRunningChange = useCallback((e) => {
        const value = e.target.value;
        setInputValue(value);
        
        // Clear existing timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        // Set new timer
        const timer = setTimeout(() => {
            const evaluatedValue = evaluateMath(value);
            setInputValue(evaluatedValue);
            setBalance(evaluatedValue);
        }, 1000);
        
        setDebounceTimer(timer);
    }, [debounceTimer, evaluateMath]);
    
    const handleRunningBlur = useCallback((e) => {
        const value = e.target.value;
        const evaluatedValue = evaluateMath(value);
        setInputValue(evaluatedValue);
        setBalance(evaluatedValue);
        
        // Clear debounce timer since we're processing immediately
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            setDebounceTimer(null);
        }
    }, [debounceTimer, evaluateMath]);
    
    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [debounceTimer]);
    
    // Save theme preference and update document
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        document.documentElement.setAttribute('data-mui-color-scheme', darkMode ? 'dark' : 'light');
    }, [darkMode]);
    
    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => !prev);
    }, []);

    const theme = useMemo(() => getTheme(darkMode), [darkMode]);

    const rowStyle = (record) => {
        const running = parseFloat(record.row.running);
        if (running < 0) return 'error';
        if (running <= 200) return 'warning';
        return ''; // No special styling for normal positive balances
    };
    const fmtMoney = (val) => `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const AccentBar = ({ gradient }) => (
        <Box sx={{ height: 3, background: gradient, borderRadius: '12px 12px 0 0' }} />
    );

    const SectionTitle = ({ icon, title, chip }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography variant="subtitle1" color="text.primary" fontWeight={600}>{title}</Typography>
            {chip}
        </Box>
    );

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
                    <Grid container spacing={2}>
                    {loggingIn ? null : user ? (
                        <>
                            <Grid item md={12}>
                                <Header user={user} logout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode}/>
                            </Grid>
                            <Grid item md={9} xs={12}>
                                <Grid container spacing={2}>
                                    <Grid item md={12}>
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
                                    </Grid>
                                    <Grid item md={12}>
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
                                                    getRowClassName={rowStyle}
                                                    columns={columns}
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
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid item md={3} xs={12}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Card>
                                            <AccentBar gradient={theme.palette.gradient.hero} />
                                            <CardContent sx={{ py: 2 }}>
                                                <SectionTitle icon={<AccountBalance fontSize="small" color="primary" />} title="Current Balance" />
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                                                    Enter your current account balance to see how your budget will play out over time.
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    label="Current Balance"
                                                    onChange={handleRunningChange}
                                                    onBlur={handleRunningBlur}
                                                    value={inputValue}
                                                    placeholder="Enter amount or math (e.g., 1345+123)"
                                                    variant="outlined"
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Card>
                                            <AccentBar gradient={theme.palette.gradient.primary} />
                                            <CardContent sx={{ py: 2 }}>
                                                <SectionTitle icon={<AccountBalance fontSize="small" color="primary" />} title="Summary" />
                                                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {/* Income row */}
                                                    <Box sx={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        p: 1, borderRadius: 1,
                                                        borderLeft: '3px solid',
                                                        borderColor: 'success.main',
                                                        bgcolor: darkMode ? 'rgba(102,187,106,0.06)' : 'rgba(46,125,50,0.04)',
                                                    }}>
                                                        <Typography variant="body2" color="text.secondary">Income</Typography>
                                                        <Typography variant="body1" fontWeight={600} color="success.main" fontFamily='"JetBrains Mono", monospace'>
                                                            {fmtMoney(income)}
                                                        </Typography>
                                                    </Box>
                                                    {/* Expenses row */}
                                                    <Box sx={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        p: 1, borderRadius: 1,
                                                        borderLeft: '3px solid',
                                                        borderColor: 'error.main',
                                                        bgcolor: darkMode ? 'rgba(239,83,80,0.06)' : 'rgba(211,47,47,0.04)',
                                                    }}>
                                                        <Typography variant="body2" color="text.secondary">Expenses</Typography>
                                                        <Typography variant="body1" fontWeight={600} color="error.main" fontFamily='"JetBrains Mono", monospace'>
                                                            {fmtMoney(expenses)}
                                                        </Typography>
                                                    </Box>
                                                    {/* Net row */}
                                                    <Box sx={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        p: 1, borderRadius: 1,
                                                        borderLeft: '3px solid',
                                                        borderColor: 'primary.main',
                                                        bgcolor: darkMode ? 'rgba(103,58,183,0.08)' : 'rgba(103,58,183,0.04)',
                                                    }}>
                                                        <Typography variant="body2" fontWeight={600} color="text.primary">Net</Typography>
                                                        <Typography variant="body1" fontWeight={700} color={income - expenses >= 0 ? 'success.main' : 'error.main'} fontFamily='"JetBrains Mono", monospace'>
                                                            {fmtMoney(income - expenses)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Divider sx={{ my: 1.5 }} />
                                                {/* Min/Max side by side */}
                                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                    <Box sx={{
                                                        flex: 1, textAlign: 'center', p: 1.5, borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: min < 0 ? 'error.light' : 'divider',
                                                    }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Lowest</Typography>
                                                        <Typography variant="body1" fontWeight={600} fontFamily='"JetBrains Mono", monospace' color={min < 0 ? 'error.main' : 'text.primary'}>
                                                            {fmtMoney(min)}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{
                                                        flex: 1, textAlign: 'center', p: 1.5, borderRadius: 1,
                                                        border: '1px solid',
                                                        borderColor: 'divider',
                                                    }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Highest</Typography>
                                                        <Typography variant="body1" fontWeight={600} fontFamily='"JetBrains Mono", monospace'>
                                                            {fmtMoney(max)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {evtsFlat.length > 0 && (
                                        <Grid item xs={12}>
                                            <Card>
                                                <AccentBar gradient={theme.palette.gradient.primary} />
                                                <CardContent sx={{ py: 2 }}>
                                                    <SectionTitle icon={<TrendingUp fontSize="small" color="primary" />} title="Balance Trend" />
                                                    <Box sx={{ mt: 1 }}>
                                                        <RunningChart options={runningOptions} series={series} />
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12}>
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
                        </Grid>
                    )}
                    </Grid>
                </Container>
            </Box>
        </ThemeProvider>
    );
};
