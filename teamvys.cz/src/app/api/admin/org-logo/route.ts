import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const BUCKET = 'org-assets';

function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase admin config.');
  return createClient(url, key, { auth: { persistSession: false } });
}

function createUserClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Missing Supabase browser config.');
  return createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (!token) return NextResponse.json({ error: 'Nepřihlášen.' }, { status: 401 });

    // Verify user is admin
    const userClient = createUserClient(token);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neplatný token.' }, { status: 401 });

    const { data: profile } = await userClient.from('app_profiles').select('role,org_id').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Přístup zamítnut.' }, { status: 403 });

    const orgId = profile.org_id as string | null;
    if (!orgId) return NextResponse.json({ error: 'Organizace nenalezena.' }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Chybí soubor.' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const path = `${orgId}/logo.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const admin = createAdminClient();

    // Ensure bucket exists (public, images only, 5 MB limit)
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.find((b) => b.name === BUCKET)) {
      await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
      });
    }

    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: file.type,
    });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await admin.from('organizations').update({ logo_url: path }).eq('id', orgId);

    return NextResponse.json({ publicUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Chyba serveru.' }, { status: 500 });
  }
}
