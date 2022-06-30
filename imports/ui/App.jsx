import React, {Fragment, useState} from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { EventsCollection } from '/imports/db/EventsCollection';
import { Event } from './Event';
import { EventForm } from './EventForm';
import { DateRangeForm } from "./DateRangeForm";
import {LoginForm} from "./LoginForm";
import {MdLogout} from "react-icons/all";
import {DateTime} from "luxon";
import { RRule } from 'rrule';

const deleteEvent = ({ _id }) => Meteor.call('events.remove', _id);
const editEvent = (evt) => {

};

export const App = () => {
    let evtsFlat = [];

    const [start, setStart] = useState(DateTime.now().toISODate());
    const [end, setEnd] = useState(DateTime.now().plus({ months: 1 }).toISODate());

    const user = useTracker(() => Meteor.user());
    const logout = () => Meteor.logout();

    const userFilter = user ? { userId: user._id } : {};

    useTracker(() => {
        if (!user) return [];

        const handler = Meteor.subscribe('events');
        if (!handler.ready()) {
            return [];
        }

        let evtsAll = EventsCollection.find(userFilter, {sort: {createdAt: -1}}).fetch();

        evtsAll.forEach(evt => {
            let rule = RRule.fromString(evt.rule);
            rule.between(DateTime.fromISO(start).toJSDate(), DateTime.fromISO(end).toJSDate()).forEach((instance, idx) => {
                evtsFlat.push({
                    ...evt,
                    listId: evt._id + idx,
                    timestamp: instance.getTime(),
                    due: instance.toDateString()
                })
            })
        });

        evtsFlat.sort((a, b) => a.timestamp >= b.timestamp ? 1 : -1)
    });

    return (
        <div className="app">
            <header>
                <div className="app-bar">
                    <div className="app-header">
                        <h1>Budget your life, you nincompoop</h1>
                    </div>
                    { user ? (
                        <div className="user" onClick={logout}>
                            {user.username || user.profile.name}
                            &nbsp;<MdLogout />
                        </div>
                    ) : ("")}

                </div>
            </header>

            <div className="main">
                { user ? (
                    <Fragment>
                        <div>
                            <DateRangeForm
                                start={start}
                                end={end}
                                setStart={setStart}
                                setEnd={setEnd}
                            />
                        </div>

                        <EventForm event={{}} />

                        <ul className="events">
                            {evtsFlat.map(evt => (
                                <Event
                                    key={evt.listId}
                                    evt={evt}
                                    onEditClick={editEvent}
                                    onDeleteClick={deleteEvent}
                                />
                            ))}
                        </ul>
                    </Fragment>
                ) : (
                    <LoginForm />
                )}
            </div>


        </div>
    );
};