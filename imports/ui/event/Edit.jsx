import { MdOutlineCancel} from "react-icons/md";

import React, {useState} from 'react';
import {Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip} from "@mui/material";
import {EventAvailable, EventBusy} from "@mui/icons-material";
import {Meteor} from "meteor/meteor";
import EditEventBtnForm from "./EditEventBtnForm";

const SkipBtn = ({ evt }) => (
    <Tooltip arrow placement="top" title={evt.skipped ? "Un-skip this occurrence" : "Skip this occurrence"}>
        <IconButton
            size="small"
            onClick={() => Meteor.call('events.toggleSkip', evt._id, evt.dueISO)}
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                color: evt.skipped ? 'primary.main' : 'text.secondary',
                borderRadius: 1.5,
            }}
        >
            {evt.skipped ? <EventAvailable sx={{ fontSize: 16 }} /> : <EventBusy sx={{ fontSize: 16 }} />}
        </IconButton>
    </Tooltip>
);

export const Edit = ({ evt, onDeleteClick}) => {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isFirst = evt.listId === evt._id + '0';

    return (
        <Box sx={{width: '100%', height: '100%', display: "flex", gap: '8px', justifyContent: 'center', alignItems: 'center'}}>
            {evt.recurring && evt.type !== 'cc_payment' && <SkipBtn evt={evt} />}
            {isFirst && <>
            <EditEventBtnForm event={evt} />
            <Tooltip arrow title="Delete item" placement="top">
                <IconButton
                    size="small"
                    onClick={ () => setConfirmOpen(true) }
                    sx={{
                        border: '1px solid',
                        borderColor: 'error.light',
                        color: 'error.main',
                        borderRadius: 1.5,
                        '&:hover': {
                            bgcolor: 'rgba(244,67,54,0.08)',
                        },
                    }}
                >
                    <MdOutlineCancel size={16} />
                </IconButton>
            </Tooltip>
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Delete {evt.title}?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This action cannot be undone. This will permanently delete this item.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={() => { onDeleteClick(evt); setConfirmOpen(false); }}>Delete</Button>
                </DialogActions>
            </Dialog>
            </>}
        </Box>
    )
}
