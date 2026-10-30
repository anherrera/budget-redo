// The app has one user. Pangolin gates the public hostname, but anyone who
// got past it with any GitHub or Google account would otherwise be able to
// create an account here, and their events would land in /api/bills.
//
// ALLOWED_LOGINS is a comma-separated list of `github:<username>` and
// `google:<email>` entries; it defaults to the owner.
const DEFAULT_ALLOWED = 'github:anherrera';

export const allowedLogins = (raw = process.env.ALLOWED_LOGINS) =>
    (raw || DEFAULT_ALLOWED).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

export const isAllowedUser = (user, allowed = allowedLogins()) => {
    const services = user?.services || {};
    const ids = [];
    if (services.github?.username) ids.push(`github:${services.github.username}`);
    if (services.google?.email) ids.push(`google:${services.google.email}`);
    return ids.some((id) => allowed.includes(id.toLowerCase()));
};
