import React from 'react';

export const Title = ({ evt }) => {
    return evt.autoPay === true ? (
        <span>{evt.title}</span>
    ) : (<strong>{evt.title}</strong>)
}
