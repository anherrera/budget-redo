import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';
import '/imports/api/eventsMethods';
import '/imports/api/eventsPublications';

Meteor.startup(() => {
        ServiceConfiguration.configurations.upsert(
            { service: 'github' },
            {
                    $set: {
                            loginStyle: 'popup',
                            clientId: 'a16cbe96a4e9dba9bb66', // insert your clientId here
                            secret: '7603666f5dc7c508ead3f0909cddab43abe28fe3', // insert your secret here
                    },
            }
        );
});
