import {Due} from "../ui/event/Due";
import {Edit} from "../ui/event/Edit";
import {Title} from "../ui/event/Title";
import React from "react";
import { Meteor } from 'meteor/meteor';
import { Tooltip } from "@mui/material";

const money = (amt) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(amt)
const moneyFromCents = (cents) => money((cents || 0) / 100);
const deleteEvent = ({_id}) => Meteor.call('events.removeAsync', _id);

const columns = [
    {
        field: 'title',
        flex: 2,
        headerName: 'Title',
        editable: false,
        renderCell: (title) => <Title evt={title.row} />
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
        align: 'left',
        headerAlign: 'left',
        editable: false,
        sortable: true,
        renderCell: (ts) => <Due evt={ts.row}/>
    },
    {
        field: 'amountCents',
        flex: 1,
        headerName: 'Amount',
        editable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
            const event = params.row;
            const amount = moneyFromCents(params.value);
            
            if (event.type === 'cc_payment' && event.ccStatement?.statementDate) {
                const statementDate = new Date(event.ccStatement.statementDate + 'T00:00:00').toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                });
                return (
                    <Tooltip title={`Due Date: ${statementDate}`} arrow>
                        <span className="cc-amount-with-due">{amount}</span>
                    </Tooltip>
                );
            }
            
            return <span className="monospace">{amount}</span>;
        }
    },
    {
        field: 'running',
        flex: 1,
        headerName: "Running",
        editable: false,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
            const amount = money(params.value);
            return <span className="monospace">{amount}</span>;
        }
    },
    {
        field: 'actions',
        flex: 1.5,
        headerName: 'Actions',
        sortable: false,
        editable: false,
        renderCell: (actions) => <Edit evt={actions.row} onDeleteClick={deleteEvent}/>
    }
];

export default columns;
