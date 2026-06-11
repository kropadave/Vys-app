// Edge Function: organizations-overview (multi-tenant Phase 4)
//
// Super Admin cross-organization dashboard backend.
//   • Verifies the CALLING USER's JWT and requires app_profiles.super_admin = true.
//   • Uses the service role key (auto-injected in the Edge runtime) for
//     cross-org queries — the key never reaches any client.
//   • Returns AGGREGATE data only: org metadata, subscription status, next
//     payment date, coach/participant counts, monthly revenue. Never returns
//     names, attendance, or any personal data of other orgs' members.
//   • POST { action: 'set_status', orgId, subscriptionStatus } lets the super
//     admin manually activate ('active') or deactivate ('canceled') an org.
//     The VYS org (subscription_status = 'exempt') can never be modified.
//
// Deploy: npx supabase functions deploy organizations-overview

import { corsHeaders, jsonResponse, supabaseRestHeaders, supabaseRestUrl } from '../_shared/http.ts';

const ORG_MONTHLY_PRICE_CZK = 790;

type OrgRow = {
  id: string;
  name: string;
  org_type: 'vys' | 'external';
  sport_type: string | null;
  city: string | null;
  contact_email: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
};

type MemberRow = { org_id: string; role: string };

async function requireSuperAdmin(request: Request): Promise<string> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw httpError('Přihlášení je vyžadováno.', 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) throw httpError('Chybí SUPABASE_URL nebo SUPABASE_ANON_KEY.', 500);

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  const user = await userResponse.json().catch(() => null);
  if (!userResponse.ok || typeof user?.id !== 'string') {
    throw httpError('Přihlášení vypršelo nebo není platné.', 401);
  }

  // Service-role check of the super_admin flag — RLS-independent.
  const profileResponse = await fetch(
    supabaseRestUrl(`app_profiles?id=eq.${encodeURIComponent(user.id)}&select=id,super_admin&limit=1`),
    { headers: supabaseRestHeaders() },
  );
  const profiles = await profileResponse.json().catch(() => []);
  if (!profileResponse.ok || !Array.isArray(profiles) || profiles.length === 0 || profiles[0].super_admin !== true) {
    throw httpError('Tahle operace je pouze pro super admina.', 403);
  }

  return user.id;
}

function httpError(message: string, status: number) {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

async function loadOverview() {
  const [orgsResponse, membersResponse] = await Promise.all([
    fetch(
      supabaseRestUrl(
        'organizations?select=id,name,org_type,sport_type,city,contact_email,subscription_status,trial_ends_at,subscription_ends_at,created_at&order=created_at.asc',
      ),
      { headers: supabaseRestHeaders() },
    ),
    // Aggregated in-function; only counts leave this function.
    fetch(supabaseRestUrl('organization_members?select=org_id,role'), { headers: supabaseRestHeaders() }),
  ]);

  const orgs = (await orgsResponse.json().catch(() => [])) as OrgRow[];
  const members = (await membersResponse.json().catch(() => [])) as MemberRow[];
  if (!orgsResponse.ok || !membersResponse.ok || !Array.isArray(orgs) || !Array.isArray(members)) {
    throw httpError('Nepodařilo se načíst přehled organizací.', 500);
  }

  const counts = new Map<string, { coaches: number; participants: number }>();
  for (const member of members) {
    const entry = counts.get(member.org_id) ?? { coaches: 0, participants: 0 };
    if (member.role === 'coach') entry.coaches += 1;
    if (member.role === 'participant') entry.participants += 1;
    counts.set(member.org_id, entry);
  }

  const organizations = orgs.map((org) => ({
    id: org.id,
    name: org.name,
    orgType: org.org_type,
    sportType: org.sport_type,
    city: org.city,
    contactEmail: org.contact_email,
    subscriptionStatus: org.subscription_status,
    trialEndsAt: org.trial_ends_at,
    // "next payment date": end of trial while trialing, else current period end
    nextPaymentAt: org.subscription_status === 'trialing' ? org.trial_ends_at : org.subscription_ends_at,
    coachCount: counts.get(org.id)?.coaches ?? 0,
    participantCount: counts.get(org.id)?.participants ?? 0,
    createdAt: org.created_at,
  }));

  const activeCount = organizations.filter((org) => org.subscriptionStatus === 'active').length;

  return {
    organizations,
    totals: {
      orgCount: organizations.length,
      activeCount,
      trialingCount: organizations.filter((org) => org.subscriptionStatus === 'trialing').length,
      pastDueCount: organizations.filter((org) => org.subscriptionStatus === 'past_due').length,
      monthlyRevenueCzk: activeCount * ORG_MONTHLY_PRICE_CZK,
    },
  };
}

async function setOrgStatus(orgId: string, subscriptionStatus: string) {
  if (!['active', 'canceled'].includes(subscriptionStatus)) {
    throw httpError("Povolené stavy jsou pouze 'active' a 'canceled'.", 400);
  }

  // Never touch the exempt platform owner (VYS).
  const response = await fetch(
    supabaseRestUrl(
      `organizations?id=eq.${encodeURIComponent(orgId)}&subscription_status=neq.exempt`,
    ),
    {
      method: 'PATCH',
      headers: { ...supabaseRestHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({ subscription_status: subscriptionStatus }),
    },
  );
  const rows = await response.json().catch(() => []);
  if (!response.ok) throw httpError('Změna stavu organizace selhala.', 500);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw httpError('Organizace nebyla nalezena nebo je exempt (VYS nelze měnit).', 404);
  }

  return { ok: true, orgId, subscriptionStatus };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } });
  }

  try {
    await requireSuperAdmin(request);

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (body.action === 'set_status') {
        if (typeof body.orgId !== 'string' || typeof body.subscriptionStatus !== 'string') {
          throw httpError('Chybí orgId nebo subscriptionStatus.', 400);
        }
        return jsonResponse(await setOrgStatus(body.orgId, body.subscriptionStatus));
      }
      if (body.action && body.action !== 'overview') throw httpError('Neznámá akce.', 400);
    }

    return jsonResponse(await loadOverview());
  } catch (error) {
    const status = (error as { status?: number }).status ?? 400;
    return jsonResponse({ error: (error as Error).message ?? 'Neočekávaná chyba.' }, status);
  }
});
