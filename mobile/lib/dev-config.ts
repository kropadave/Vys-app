// Production is locked by default. Enable bypass only for local demo runs.
// Set EXPO_PUBLIC_DEV_BYPASS_AUTH=true when you intentionally want prototype access.
export const DEV_BYPASS_AUTH = process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true';

// Set EXPO_PUBLIC_DEV_BYPASS_ROLE_GUARD=true only when testing routes directly.
export const DEV_BYPASS_ROLE_GUARD = process.env.EXPO_PUBLIC_DEV_BYPASS_ROLE_GUARD === 'true';
