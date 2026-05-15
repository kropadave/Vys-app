import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function requiredString(value: unknown, label: string) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`Missing ${label}.`);
  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizePersonNamePart(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function birthNumberSuffix(value: unknown) {
  return String(value || '').replace(/\D/g, '').slice(-4);
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
    const firstName = requiredString(body.firstName, 'firstName');
    const lastName = requiredString(body.lastName, 'lastName');
    const birthSuffix = birthNumberSuffix(requiredString(body.birthNumber, 'birthNumber'));

    if (birthSuffix.length < 4) return NextResponse.json({ error: 'Zadej aspoň poslední 4 číslice rodného čísla.' }, { status: 400 });

    const { data: candidates, error: candidatesError } = await supabase
      .from('participants')
      .select('id,parent_profile_id,first_name,last_name,birth_number_masked,active_course')
      .ilike('birth_number_masked', `%${birthSuffix}`)
      .limit(50);

    if (candidatesError) throw candidatesError;

    const normalizedFirstName = normalizePersonNamePart(firstName);
    const normalizedLastName = normalizePersonNamePart(lastName);
    const participant = (candidates || []).find((candidate) => {
      const firstMatches = normalizePersonNamePart(candidate.first_name) === normalizedFirstName;
      const lastMatches = normalizePersonNamePart(candidate.last_name) === normalizedLastName;
      const birthMatches = birthNumberSuffix(candidate.birth_number_masked) === birthSuffix;
      return firstMatches && lastMatches && birthMatches;
    });

    if (!participant) return NextResponse.json({ error: 'Účastník se podle jména a rodného čísla nenašel.' }, { status: 404 });
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