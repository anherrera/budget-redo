import {Meteor} from 'meteor/meteor';
import {ServiceConfiguration} from 'meteor/service-configuration';
import '/imports/api/eventsMethods';
import '/imports/api/eventsPublications';

Meteor.startup(() => {
    ServiceConfiguration.configurations.upsertAsync(
        {service: 'github'},
        {
            $set: {
                loginStyle: 'redirect',
                clientId: process.env.GITHUB_CLIENT_ID,
                secret: process.env.GITHUB_SECRET,
            },
        }
    );

    ServiceConfiguration.configurations.upsertAsync(
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
