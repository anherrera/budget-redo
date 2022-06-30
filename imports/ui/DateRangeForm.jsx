import React from 'react';
export const DateRangeForm = ({start, end, setStart, setEnd}) => {
    const handleSubmit = e => {
        e.preventDefault();

        if (!start) return;
        if (!end) return;

        setStart(start);
        setEnd(end);
    };

    return (
        <form className="date-range-form" onSubmit={handleSubmit}>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)}/>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}/>
        </form>
    );
};