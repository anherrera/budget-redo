import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Meteor} from 'meteor/meteor';
import {DateTime} from "luxon";
import {Card, CardContent, TextField, Typography} from "@mui/material";
import {AccountBalance} from "@mui/icons-material";
import {AccentBar, SectionTitle} from "./Section";

// "1345+123" -> "1468"; anything that is not plain arithmetic is returned as typed.
const evaluateMath = (expression) => {
    try {
        if (!/^[0-9+\-*/().\s]+$/.test(expression)) return expression;
        const result = Function('"use strict"; return (' + expression + ')')();
        return Number.isFinite(result) ? String(Math.round(result * 100) / 100) : expression;
    } catch {
        return expression;
    }
};

const isNumber = (value) => value === '' || /^-?\d+(\.\d+)?$/.test(value);

/**
 * The starting balance. It is saved on the user's profile, so it is still there
 * after a reload and on other devices; `onBalance` gets every committed value.
 */
export const BalanceCard = ({user, onBalance, gradient}) => {
    const saved = user?.profile?.balance ?? '';
    const savedAt = user?.profile?.balanceUpdatedAt;
    const [input, setInput] = useState(saved);
    const timer = useRef(null);
    const focused = useRef(false);

    // Adopt the saved value on load, and when it changes on another device.
    useEffect(() => {
        if (!focused.current) setInput(saved);
        onBalance(saved);
    }, [saved]);

    useEffect(() => () => clearTimeout(timer.current), []);

    const commit = useCallback((raw) => {
        clearTimeout(timer.current);
        const value = evaluateMath(raw.trim());
        setInput(value);
        onBalance(value);
        if (isNumber(value) && value !== saved) Meteor.call('user.setBalance', value);
    }, [saved, onBalance]);

    const handleChange = (e) => {
        const value = e.target.value;
        setInput(value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => commit(value), 1000);
    };

    return (
        <Card>
            <AccentBar gradient={gradient} />
            <CardContent sx={{ py: 2 }}>
                <SectionTitle icon={<AccountBalance fontSize="small" color="primary" />} title="Current Balance" />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1, display: { xs: 'none', md: 'block' } }}>
                    Enter your current account balance to see how your budget will play out over time.
                </Typography>
                <TextField
                    fullWidth
                    label="Current Balance"
                    onChange={handleChange}
                    onFocus={() => { focused.current = true; }}
                    onBlur={(e) => { focused.current = false; commit(e.target.value); }}
                    value={input}
                    placeholder="Amount or math (e.g., 1345+123)"
                    variant="outlined"
                    inputProps={{ inputMode: 'decimal' }}
                    helperText={saved !== '' && savedAt ? `Saved ${DateTime.fromMillis(savedAt).toRelative()}` : ' '}
                    sx={{ mt: { xs: 1.5, md: 0 } }}
                />
            </CardContent>
        </Card>
    );
};
