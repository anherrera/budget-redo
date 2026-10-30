import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {isAllowedUser} from '/imports/api/allowedUsers';

Accounts.validateNewUser((user) => {
    if (!isAllowedUser(user)) throw new Meteor.Error(403, 'Sign-ups are closed');
    return true;
});

// Also refuse logins, so an account created before the allowlist cannot sign in.
Accounts.validateLoginAttempt((attempt) => attempt.allowed && isAllowedUser(attempt.user));
