import {Meteor} from 'meteor/meteor';
import {check} from 'meteor/check';

/** '' clears the balance; anything else must be a plain decimal number. */
export const isValidBalance = (balance) =>
    typeof balance === 'string' && (balance === '' || /^-?\d{1,12}(\.\d+)?$/.test(balance));

Meteor.methods({
    // The starting balance the running totals are computed from, kept on the
    // user so it survives reloads and follows them across devices.
    async 'user.setBalance'(balance) {
        check(balance, String);
        if (!this.userId) throw new Meteor.Error('Not authorized.');
        if (!isValidBalance(balance)) throw new Meteor.Error('validation-error', 'Balance must be a number.');
        await Meteor.users.updateAsync(this.userId, {
            $set: {'profile.balance': balance, 'profile.balanceUpdatedAt': Date.now()},
        });
    },
});
