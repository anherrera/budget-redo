import {Due} from "../ui/event/Due";
import {Edit} from "../ui/event/Edit";
import {Title} from "../ui/event/Title";
import React from "react";

const money = (amt) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(amt)
const deleteEvent = ({_id}) => Meteor.call('events.remove', _id);

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
        editable: false,
        sortable: true,
        renderCell: (ts) => <Due evt={ts.row}/>
    },
    {
        field: 'amount',
        flex: 1,
        headerName: 'Amount',
        editable: false,
        align: "right",
        valueFormatter: (amt) => money(amt.value)
    },
    {
        field: 'running',
        flex: 1,
        headerName: "Running",
        editable: false,
        align: "right",
        valueFormatter: (amt) => money(amt.value)
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