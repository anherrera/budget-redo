import { DateTime } from 'luxon';

/**
 * Adjusts a date to the previous Friday if it falls on a weekend
 * @param {Date} date - The date to adjust
 * @returns {Date} - The adjusted date
 */
export const adjustToWeekday = (date) => {
    const dt = DateTime.fromJSDate(date);
    const dayOfWeek = dt.weekday; // 1=Monday, 7=Sunday
    
    if (dayOfWeek === 6) { // Saturday
        return dt.minus({ days: 1 }).toJSDate(); // Friday
    } else if (dayOfWeek === 7) { // Sunday
        return dt.minus({ days: 2 }).toJSDate(); // Friday
    }
    return date;
};

/**
 * Checks if an event should use weekday adjustment
 * @param {Object} event - The event object
 * @returns {boolean} - Whether the event should use weekday adjustment
 */
export const shouldAdjustToWeekday = (event) => {
    // Only adjust for monthly events with weekdaysOnly enabled
    // or events that have Mon-Fri selected in weekdays
    if (!event.recurring) return false;
    
    if (event.weekdaysOnly) return true;
    
    if (event.weekdays && Array.isArray(event.weekdays)) {
        // Check if weekdays array contains exactly Mon-Fri
        const weekdaySet = new Set(event.weekdays);
        // RRule weekdays are stored as strings like "MO", "TU", etc.
        return weekdaySet.size === 5 && 
               !weekdaySet.has('SA') && 
               !weekdaySet.has('SU');
    } else if (event.weekdays && typeof event.weekdays === 'string' && event.weekdays.length > 0) {
        // Handle comma-separated string format
        const weekdayArray = event.weekdays.split(',');
        const weekdaySet = new Set(weekdayArray);
        return weekdaySet.size === 5 && 
               !weekdaySet.has('SA') && 
               !weekdaySet.has('SU');
    }
    
    return false;
};