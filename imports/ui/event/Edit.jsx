import { MdOutlineCancel} from "react-icons/md";

import React, {useState} from 'react';
import {Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip} from "@mui/material";
import EditEventBtnForm from "./EditEventBtnForm";

export const Edit = ({ evt, onDeleteClick}) => {
    const [confirmOpen, setConfirmOpen] = useState(false);

    return (evt.listId === evt._id + '0' ? (
        <Box sx={{width: '100%', height: '100%', display: "flex", gap: '8px', justifyContent: 'center', alignItems: 'center'}}>
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
        </Box>
    ) : <></>)
}
