import React from 'react';
import {Box, Card, CardContent, Divider, Typography} from "@mui/material";
import {AccountBalance} from "@mui/icons-material";
import {AccentBar, SectionTitle} from "./Section";

const mono = '"JetBrains Mono", monospace';
const fmtMoney = (val) => `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Row = ({label, value, color, tint, bold}) => (
    <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        p: 1, borderRadius: 1, borderLeft: '3px solid', borderColor: `${color}.main`, bgcolor: tint,
    }}>
        <Typography variant="body2" fontWeight={bold ? 600 : 400} color={bold ? 'text.primary' : 'text.secondary'}>{label}</Typography>
        <Typography variant="body1" fontWeight={bold ? 700 : 600} color={`${value.color || color}.main`} fontFamily={mono}>
            {fmtMoney(value.amount)}
        </Typography>
    </Box>
);

const Extreme = ({label, amount, date, negative}) => (
    <Box sx={{
        flex: 1, textAlign: 'center', p: 1.5, borderRadius: 1,
        border: '1px solid', borderColor: negative ? 'error.light' : 'divider',
    }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</Typography>
        <Typography variant="body1" fontWeight={600} fontFamily={mono} color={negative ? 'error.main' : 'text.primary'}>
            {fmtMoney(amount)}
        </Typography>
        {date && <Typography variant="caption" color="text.secondary" component="div">on {date}</Typography>}
    </Box>
);

export const SummaryCard = ({income, expenses, min, minDate, max, darkMode, gradient}) => {
    const net = income - expenses;
    return (
        <Card>
            <AccentBar gradient={gradient} />
            <CardContent sx={{ py: 2 }}>
                <SectionTitle icon={<AccountBalance fontSize="small" color="primary" />} title="Summary" />
                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Row label="Income" value={{amount: income}} color="success"
                         tint={darkMode ? 'rgba(102,187,106,0.06)' : 'rgba(46,125,50,0.04)'} />
                    <Row label="Expenses" value={{amount: expenses}} color="error"
                         tint={darkMode ? 'rgba(239,83,80,0.06)' : 'rgba(211,47,47,0.04)'} />
                    <Row label="Net" bold value={{amount: net, color: net >= 0 ? 'success' : 'error'}} color="primary"
                         tint={darkMode ? 'rgba(103,58,183,0.08)' : 'rgba(103,58,183,0.04)'} />
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Extreme label="Lowest" amount={min} date={minDate} negative={min < 0} />
                    <Extreme label="Highest" amount={max} />
                </Box>
            </CardContent>
        </Card>
    );
};
