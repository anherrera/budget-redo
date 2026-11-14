// At or below this many dollars a running balance is flagged as low.
export const LOW_BALANCE = 200;

/** 'error' when overdrawn, 'warning' when low, '' otherwise. */
export const balanceStatus = (running) => {
    const value = parseFloat(running);
    if (value < 0) return 'error';
    if (value <= LOW_BALANCE) return 'warning';
    return '';
};
