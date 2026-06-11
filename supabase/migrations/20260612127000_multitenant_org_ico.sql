-- Organization existence verification: store the registry ID (IČO) and the
-- official name returned by ARES so the super admin can verify the org is real.
alter table public.organizations add column if not exists ico text;
alter table public.organizations add column if not exists ares_name text;

create temp table _t on commit drop as
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'organizations' and column_name in ('ico', 'ares_name');
select * from _t;
