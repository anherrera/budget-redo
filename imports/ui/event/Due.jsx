import React from 'react';
import {Tooltip} from "@mui/material";

export const Due = ({ evt }) => {
    return (
        <Tooltip title={evt.dueHuge}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{evt.due}</span>
        </Tooltip>
    )
}
