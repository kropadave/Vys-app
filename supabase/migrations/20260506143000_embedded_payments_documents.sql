-- Embedded Stripe payments, required workshop documents, and product metadata used by TeamVYS web/mobile.

alter table public.products add column if not exists capacity_current integer not null default 0;
alter table public.products add column if not exists hero_image text;
alter table public.products add column if not exists gallery jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists coach_ids text[] not null default '{}';
alter table public.products add column if not exists training_focus text[] not null default '{}';
alter table public.products add column if not exists is_published boolean not null default true;

alter table public.parent_purchases add column if not exists parent_profile_id text references public.app_profiles(id) on delete set null;
alter table public.parent_purchases add column if not exists original_amount integer;
alter table public.parent_purchases add column if not exists discount_code text;
alter table public.parent_purchases add column if not exists discount_percent integer;
alter table public.parent_purchases add column if not exists discount_amount integer not null default 0;
alter table public.parent_purchases add column if not exists stripe_payment_intent_id text;

create unique index if not exists parent_purchases_stripe_payment_intent_id_key
  on public.parent_purchases (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

do $$
begin
  alter table public.course_documents drop constraint if exists course_documents_activity_type_check;
  alter table public.course_documents add constraint course_documents_activity_type_check check (activity_type in ('Kroužek', 'Tábor', 'Workshop'));

  alter table public.course_documents drop constraint if exists course_documents_kind_check;
  alter table public.course_documents add constraint course_documents_kind_check check (kind in ('gdpr', 'guardian-consent', 'health', 'departure', 'infection-free', 'packing', 'workshop-terms'));
end $$;
