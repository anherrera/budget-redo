import {EventsCollection} from "../db/EventsCollection";
import {applyRunningBalance} from "./runningBalance";
import expandEvents from "./expandEvents";

const getCurrentEvents = (user, start, end, balance) => {
    const userFilter = user ? {userId: user._id} : {};

    if (!user) return { events: [], loading: false };

    const handler = Meteor.subscribe('events');
    if (!handler.ready()) {
        return { events: [], loading: true };
    }

    const evtsAll = EventsCollection.find(userFilter, {sort: {createdAt: -1}});
    const filteredEvts = expandEvents(evtsAll, start, end);

    return { events: applyRunningBalance(filteredEvts, balance), loading: false };
};

export default getCurrentEvents;
