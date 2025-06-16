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
    Container,
    createTheme,
    Divider,
    Grid,
    Paper,
    TextField,
    ThemeProvider,
    Typography
} from "@mui/material";
import {DataGrid} from "@mui/x-data-grid";
import EditEventBtnForm from "./event/EditEventBtnForm";



import columns from '../util/columnDef';
import defaultEvent from '../util/defaultEvent';
import getCurrentEvents from "../util/filterEvents";
import { deepPurple, teal, grey } from '@mui/material/colors';
import {RunningChart} from "./RunningChart";
import {noop} from "underscore";


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


    const user = useTracker(() => Meteor.user());
    const logout = () => Meteor.logout();

    const evtsFlat = useTracker(() => getCurrentEvents(user, start, end, balance));
    
    const { income, expenses, series, min, max, chartCategories } = useMemo(() => {
        if (!evtsFlat.length) {
            return { income: 0, expenses: 0, series: [], min: undefined, max: undefined, chartCategories: [] };
        }
        
        let totalIncome = 0;
        let totalExpenses = 0;
        let minVal, maxVal;
        
        // Group by date and get the final running total for each date
        const dailyRunning = new Map();
        
        evtsFlat.forEach((i) => {
            const amount = parseFloat(i.amount);
            if (i.type === 'bill') {
                totalExpenses += amount;
            } else if (i.type === 'income') {
                totalIncome += amount;
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
            income: totalIncome,
            expenses: totalExpenses,
            series: chartSeries,
            min: minVal,
            max: maxVal,
            chartCategories
        };
    }, [evtsFlat]);

    const runningOptions = {
        chart: {
            id: 'runningChart',
            background: 'transparent'
        },
        theme: {
            mode: darkMode ? 'dark' : 'light'
        },
        plotOptions: {
            dataLabels: {
                enabled: false
            }
        },
        xaxis: {
            categories: chartCategories,
            type: 'datetime',
            labels: {
                rotate: -45,
                style: {
                    fontSize: '10px',
                    colors: darkMode ? '#e0e0e0' : '#424242'
                }
            }
        },
        yaxis: {
            min: min < 0 ? min : 0,
            labels: {
                style: {
                    colors: darkMode ? '#e0e0e0' : '#424242'
                }
            }
        },
        grid: {
            borderColor: darkMode ? '#424242' : '#e0e0e0'
        },
        stroke: {
            colors: [darkMode ? deepPurple[300] : deepPurple[500]]
        }
    };

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

    const theme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: darkMode ? deepPurple[300] : deepPurple[500],
                light: darkMode ? deepPurple[200] : deepPurple[300],
                dark: darkMode ? deepPurple[400] : deepPurple[700],
            },
            secondary: {
                main: darkMode ? teal[300] : teal[500],
                light: darkMode ? teal[200] : teal[300],
                dark: darkMode ? teal[400] : teal[700],
            },
            background: {
                default: darkMode ? grey[900] : grey[50],
                paper: darkMode ? grey[800] : '#ffffff',
            },
            text: {
                primary: darkMode ? grey[100] : grey[900],
                secondary: darkMode ? grey[400] : grey[600],
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h6: {
                fontWeight: 600,
            },
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        boxShadow: darkMode 
                            ? '0px 2px 8px rgba(0, 0, 0, 0.3)' 
                            : '0px 2px 8px rgba(0, 0, 0, 0.08)',
                        border: darkMode 
                            ? '1px solid rgba(255, 255, 255, 0.1)' 
                            : '1px solid rgba(0, 0, 0, 0.05)',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                        },
                    },
                },
            },
            MuiDataGrid: {
                styleOverrides: {
                    row: {
                        '&.error': {
                            backgroundColor: darkMode 
                                ? 'rgba(244, 67, 54, 0.15)' 
                                : 'rgba(244, 67, 54, 0.1)',
                        },
                        '&.warning': {
                            backgroundColor: darkMode 
                                ? 'rgba(255, 193, 7, 0.15)' 
                                : 'rgba(255, 193, 7, 0.1)',
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: darkMode ? deepPurple[600] : deepPurple[500],
                        '&.MuiAppBar-colorPrimary': {
                            backgroundColor: darkMode ? deepPurple[600] : deepPurple[500],
                        },
                    },
                },
            },
        },
    });

    const rowStyle = (record) => {
        const running = parseFloat(record.row.running);
        if (running < 0) return 'error';
        if (running <= 200) return 'warning';
        return ''; // No special styling for normal positive balances
    };
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 1.5 }}>
                <Container maxWidth="xl">
                    <Grid container spacing={2}>
                    {user ? (
                        <>
                            <Grid item md={12}>
                                <Header user={user} logout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode}/>
                            </Grid>
                            <Grid item md={9} xs={12}>
                                <Grid container spacing={2}>
                                    <Grid item md={12}>
                                        <Card>
                                            <CardContent sx={{ py: 2 }}>
                                                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight={600}>
                                                    Date Range
                                                </Typography>
                                                <DateRangeForm
                                                    start={start}
                                                    end={end}
                                                    setStart={setStart}
                                                    setEnd={setEnd}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item md={12}>
                                        <Card>
                                            <CardContent sx={{ py: 2 }}>
                                                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight={600}>
                                                    Add New Transaction
                                                </Typography>
                                                <EditEventBtnForm event={defaultEvent} />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item md={12}>
                                        <Card>
                                            <CardContent sx={{ p: 0 }}>
                                                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="subtitle1" color="text.primary" fontWeight={600}>
                                                        Transactions
                                                    </Typography>
                                                </Box>
                                                <Box sx={{height: '70vh', width: '100%', minHeight: 400}}>
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
                                            <CardContent sx={{ py: 2 }}>
                                                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight={600}>
                                                    Current Balance
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                                            <CardContent sx={{ py: 2 }}>
                                                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight={600}>
                                                    Summary
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body1" color="text.secondary">Income:</Typography>
                                                    <Typography variant="body1" fontWeight={600} color="success.main" fontFamily="monospace">
                                                        ${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body1" color="text.secondary">Expenses:</Typography>
                                                    <Typography variant="body1" fontWeight={600} color="error.main" fontFamily="monospace">
                                                        ${expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </Typography>
                                                </Box>
                                                <Divider sx={{ my: 1 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                    <Typography variant="body1" fontWeight={600} color="text.primary">Net:</Typography>
                                                    <Typography variant="body1" fontWeight={700} color={income - expenses >= 0 ? 'success.main' : 'error.main'} fontFamily="monospace">
                                                        ${(income - expenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="body1" color="text.secondary">Lowest Balance:</Typography>
                                                    <Typography variant="body1" fontWeight={500} fontFamily="monospace">
                                                        ${(min || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body1" color="text.secondary">Highest Balance:</Typography>
                                                    <Typography variant="body1" fontWeight={500} fontFamily="monospace">
                                                        ${(max || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {evtsFlat.length > 0 && (
                                        <Grid item xs={12}>
                                            <Card>
                                                <CardContent sx={{ py: 2 }}>
                                                    <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight={600}>
                                                        Balance Trend
                                                    </Typography>
                                                    <RunningChart options={runningOptions} series={series} />
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12}>
                            <Card sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
                                <CardContent>
                                    <LoginForm/>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                    </Grid>
                </Container>
            </Box>
        </ThemeProvider>
    );
};
