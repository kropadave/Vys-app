import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function createAdminSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on the web backend.');
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createAdminSupabaseClient();
    const parentProfileId = optionalString(body.parentProfileId) || 'parent-demo';
    const claimCode = typeof body.claimCode === 'string' ? body.claimCode.toUpperCase().trim() : '';

    if (!claimCode) return NextResponse.json({ error: 'Zadej propojovací kód účastníka.' }, { status: 400 });

    const { data: participant, error: findError } = await supabase
      .from('participants')
      .select('id,parent_profile_id,first_name,last_name,active_course')
      .eq('claim_code', claimCode)
      .maybeSingle();

    if (findError) throw findError;
    if (!participant) return NextResponse.json({ error: 'Účastník s tímto kódem nebyl nalezen. Zkontroluj kód a zkus to znovu.' }, { status: 404 });
    if (participant.parent_profile_id && participant.parent_profile_id !== parentProfileId) {
      return NextResponse.json({ error: 'Účastník už je připojený k jinému rodičovskému účtu.' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('participants')
      .update({ parent_profile_id: parentProfileId })
      .eq('id', participant.id)
      .select('id,first_name,last_name,active_course,parent_profile_id')
      .single();

    if (error) throw error;
    return NextResponse.json({ participant: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Účastníka se nepodařilo připojit.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}