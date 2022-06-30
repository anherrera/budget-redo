import { Meteor } from 'meteor/meteor';
import { EventsCollection } from '/imports/db/EventsCollection';

Meteor.publish('events', function publishEvents() {
    return EventsCollection.find({ userId: this.userId });
});