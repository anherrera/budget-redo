import {Due} from "../ui/event/Due";
import {Edit} from "../ui/event/Edit";
import {Title} from "../ui/event/Title";
import React from "react";
import { Meteor } from 'meteor/meteor';
import { Box, Chip, Tooltip } from "@mui/material";
import { WarningAmber } from "@mui/icons-material";
import { balanceStatus } from "./balanceStatus";

const money = (amt) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(amt)
const moneyFromCents = (cents) => money((cents || 0) / 100);
const deleteEvent = ({_id}) => Meteor.call('events.removeAsync', _id);

const monoSx = { fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 };

const statusColor = { error: '#ef5350', warning: '#ff9800' };
const statusLabel = { error: 'Overdrawn', warning: 'Low balance' };

// Running balance; low and overdrawn values get an icon as well as a colour.
const Running = ({ value, small }) => {
    const status = balanceStatus(value);
    return (
        <span style={{ ...monoSx, color: statusColor[status], fontSize: small ? '0.75rem' : undefined, opacity: small && !status ? 0.7 : 1 }}>
            {status && (
                <Tooltip title={statusLabel[status]} arrow>
                    <WarningAmber aria-label={statusLabel[status]} sx={{ fontSize: small ? 12 : 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
                </Tooltip>
            )}
            {money(value)}
        </span>
    );
};

const Amount = ({ event, value }) => {
    const amount = moneyFromCents(value);

    if (event.statementDate && (event.type === 'cc_payment' || (event.type === 'bill' && event.variableAmount))) {
        const statementDate = new Date(event.statementDate + 'T00:00:00').toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
        return (
            <Tooltip title={`Due Date: ${statementDate}`} arrow>
                <span className="amount-with-due">{amount}</span>
            </Tooltip>
        );
    }

    return <span style={monoSx}>{amount}</span>;
};

// Two stacked lines inside one grid cell.
const twoLineSx = { display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: 1.35, minWidth: 0 };

const columns = [
    {
        field: 'title',
        flex: 2,
        minWidth: 120,
        headerName: 'Title',
        editable: false,
        renderCell: (title) => <Title evt={title.row} />
    },
    {
        field: 'type',
        flex: 1,
        minWidth: 110,
        headerName: "Type",
        editable: false,
        renderCell: (params) => {
            const typeMap = {
                bill: { label: 'Bill', color: 'error' },
                income: { label: 'Income', color: 'success' },
                cc_payment: { label: 'Credit Card', color: 'warning' },
            };
            const config = typeMap[params.value] || { label: params.value, color: 'default' };
            return <Chip label={config.label} color={config.color} size="small" variant="filled" sx={{ letterSpacing: '0.03em' }} />;
        }
    },
    {
        field: 'timestamp',
        flex: 1,
        minWidth: 115,
        headerName: 'Due',
        type: 'number',
        align: 'left',
        headerAlign: 'left',
        editable: false,
        sortable: true,
        renderCell: (ts) => <Due evt={ts.row}/>
    },
    {
        field: 'amountCents',
        flex: 1,
        minWidth: 105,
        headerName: 'Amount',
        editable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => <Amount event={params.row} value={params.value} />
    },
    {
        field: 'running',
        flex: 1,
        minWidth: 110,
        headerName: "Running",
        editable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => <Running value={params.value} />
    },
    {
        field: 'actions',
        flex: 1.5,
        minWidth: 130,
        headerName: 'Actions',
        sortable: false,
        editable: false,
        renderCell: (actions) => <Edit evt={actions.row} onDeleteClick={deleteEvent}/>
    }
];

// Phone layout: due date under the title, running balance under the amount.
export const compactColumns = [
    {
        field: 'title',
        flex: 1,
        minWidth: 110,
        headerName: 'Title / Due',
        editable: false,
        renderCell: (params) => (
            <Box sx={twoLineSx}>
                <Title evt={params.row} hideAuto />
                <span style={{ ...monoSx, fontSize: '0.75rem', opacity: 0.7 }}>
                    {params.row.autoPay ? `${String(params.row.due).replace(/\/\d{4}$/, '')} · Auto` : params.row.due}
                </span>
            </Box>
        )
    },
    {
        field: 'amountCents',
        width: 108,
        headerName: 'Amt / Run',
        editable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => (
            <Box sx={{ ...twoLineSx, alignItems: 'flex-end' }}>
                <Amount event={params.row} value={params.value} />
                <Running value={params.row.running} small />
            </Box>
        )
    },
    {
        field: 'actions',
        width: 112,
        headerName: 'Actions',
        sortable: false,
        editable: false,
        renderCell: (actions) => <Edit evt={actions.row} onDeleteClick={deleteEvent} compact />
    }
];

export default columns;
