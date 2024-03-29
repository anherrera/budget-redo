import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ServiceConfiguration} from 'meteor/service-configuration';
import '/imports/api/eventsMethods';
import '/imports/api/eventsPublications';

Meteor.startup(() => {
    ServiceConfiguration.configurations.upsert(
        {service: 'github'},
        {
            $set: {
                loginStyle: 'redirect',
                clientId: process.env.GITHUB_CLIENT_ID,
                secret: process.env.GITHUB_SECRET,
            },
        }
    );

    ServiceConfiguration.configurations.upsert(
        {service: 'google'},
        {
            $set: {
                loginStyle: 'redirect',
                clientId: process.env.GOOGLE_CLIENT_ID,
                secret: process.env.GOOGLE_SECRET,
            },
        }
    );
});
