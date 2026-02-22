import { Mongo } from 'meteor/mongo';
import { Event } from '../types/Event';

export const EventsCollection = new Mongo.Collection<Event>('events');