/**
 * Vývojářské přepínače.
 * - DEV_BYPASS_AUTH: pokud true, app se chová jako přihlášený s mock uživatelem.
 *   Slouží jen pro lokální testování UI bez nutnosti se přihlašovat.
 *   Před vydáním nastavit na false (a ideálně řídit podle __DEV__).
 */
export const DEV_BYPASS_AUTH = true;
