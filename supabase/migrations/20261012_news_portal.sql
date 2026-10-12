-- Recuperemos Nuevo León — portal editorial de noticias.
-- Ejecutar UNA SOLA VEZ en un proyecto Supabase NUEVO.
-- Las tablas públicas tienen privilegios SQL explícitos además de RLS.

create extension if not exists pgcrypto;
create schema if not exists private;

-- Usuarios internos. Todas las cuentas nuevas nacen como visitante, sin permisos editoriales.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  role text not null default 'visitante'
    check (role in ('admin','editor','colaborador','moderador','visitante')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_profile_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, role, active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    'visitante',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_profile_on_signup() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_on_signup();

-- Funciones de apoyo para políticas. SECURITY DEFINER evita recursión de RLS al leer el rol propio.
create or replace function private.get_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = (select auth.uid()) and p.active = true
  limit 1;
$$;

create or replace function private.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.get_role()) in ('admin','editor'), false);
$$;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
revoke all on function private.get_role() from public;
revoke all on function private.is_editor() from public;
grant execute on function private.get_role() to anon, authenticated;
grant execute on function private.is_editor() to anon, authenticated;

-- Categorías oficiales: se administran como un catálogo fijo para mantener una navegación consistente.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);
insert into public.categories (name, slug) values
  ('Local', 'local'),
  ('Nacional', 'nacional'),
  ('Política', 'politica'),
  ('Espectáculos', 'espectaculos'),
  ('Viral', 'viral');

-- Noticias editoriales.
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 5 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  subtitle text not null default '' check (length(subtitle) <= 500),
  body text not null default '',
  cover_url text not null default '',
  status text not null default 'draft'
    check (status in ('draft','review','published','archived')),
  featured boolean not null default false,
  published_at timestamptz,
  category_id uuid not null references public.categories(id),
  author_id uuid not null references public.profiles(id),
  tags text not null default '' check (length(tags) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('spanish'::regconfig, coalesce(title, '') || ' ' || coalesce(subtitle, '') || ' ' || coalesce(body, ''))
  ) stored,
  constraint published_needs_date check (status <> 'published' or published_at is not null)
);
create index articles_fulltext_idx on public.articles using gin (search_vector);
create index articles_pub_idx on public.articles (status, published_at desc);
create index articles_author_idx on public.articles (author_id);
create index articles_category_published_idx on public.articles (category_id, status, published_at desc);

-- Configuración pública (no guardar claves ni secretos en esta tabla).
create table public.settings (
  key text primary key check (key in ('about_text','banner_url','instagram','youtube','facebook','contact_email','footer_text')),
  value text not null default ''
);
insert into public.settings (key, value) values
  ('about_text', ''),
  ('banner_url', ''),
  ('instagram', ''),
  ('youtube', ''),
  ('facebook', ''),
  ('contact_email', ''),
  ('footer_text', '');

-- Los mensajes solo se insertan desde una acción de servidor que valida datos y Turnstile.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 100),
  email text not null check (length(email) between 3 and 254),
  subject text not null check (length(subject) between 3 and 180),
  message text not null check (length(message) between 10 and 5000),
  kind text not null default 'contact' check (kind in ('contact','advertising')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index contact_messages_date_idx on public.contact_messages (created_at desc);

-- Auditoría básica de acciones administrativas.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null check (length(action) <= 100),
  target text not null check (length(target) <= 500),
  created_at timestamptz not null default now()
);
create index audit_logs_date_idx on public.audit_logs (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
create trigger touch_profile before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger touch_articles before update on public.articles
  for each row execute function public.touch_updated_at();

-- Habilitar Row Level Security en TODAS las tablas expuestas.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

-- Primero se retiran permisos generales; luego se concede solo lo que cada componente necesita.
revoke all privileges on all tables in schema public from public, anon, authenticated;
grant all privileges on all tables in schema public to service_role;

grant select on public.profiles to authenticated;
grant update (role, active) on public.profiles to authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;
grant select on public.settings to anon, authenticated;
grant insert, update on public.settings to authenticated;
grant select on public.contact_messages to authenticated;
grant update (read) on public.contact_messages to authenticated;
grant select on public.audit_logs to authenticated;

-- Perfil: cada miembro ve su propio perfil; administradores ven todos.
create policy profiles_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.get_role()) = 'admin');
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using ((select private.get_role()) = 'admin' and id <> (select auth.uid()))
  with check ((select private.get_role()) = 'admin' and id <> (select auth.uid()));

-- Catálogo de categorías solo de lectura desde la API.
create policy categories_read on public.categories
  for select to anon, authenticated using (true);

-- Visitantes solo leen noticias publicadas; editoría ve todo; colaborador solo sus borradores/revisiones.
create policy articles_read on public.articles
  for select to anon, authenticated
  using (
    (status = 'published' and published_at is not null and published_at <= now())
    or (select private.is_editor())
    or (author_id = (select auth.uid()) and (select private.get_role()) = 'colaborador')
  );
create policy articles_insert on public.articles
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      (select private.is_editor())
      or ((select private.get_role()) = 'colaborador' and status in ('draft','review'))
    )
  );
create policy articles_update on public.articles
  for update to authenticated
  using (
    (select private.is_editor())
    or ((select private.get_role()) = 'colaborador' and author_id = (select auth.uid()) and status in ('draft','review'))
  )
  with check (
    (select private.is_editor())
    or ((select private.get_role()) = 'colaborador' and author_id = (select auth.uid()) and status in ('draft','review'))
  );
create policy articles_delete on public.articles
  for delete to authenticated
  using (
    (select private.is_editor())
    or ((select private.get_role()) = 'colaborador' and author_id = (select auth.uid()) and status in ('draft','review'))
  );

-- Configuración visible a visitantes; únicamente administradores la cambian.
create policy settings_read on public.settings
  for select to anon, authenticated using (true);
create policy settings_admin_insert on public.settings
  for insert to authenticated with check ((select private.get_role()) = 'admin');
create policy settings_admin_update on public.settings
  for update to authenticated
  using ((select private.get_role()) = 'admin')
  with check ((select private.get_role()) = 'admin');

-- Mensajes: solo admin/moderador los leen y solo pueden actualizar la bandera de lectura por GRANT.
create policy contact_staff_read on public.contact_messages
  for select to authenticated
  using ((select private.get_role()) in ('admin','moderador'));
create policy contact_staff_update on public.contact_messages
  for update to authenticated
  using ((select private.get_role()) in ('admin','moderador'))
  with check ((select private.get_role()) in ('admin','moderador'));

-- La escritura de auditoría la realiza el servidor con SUPABASE_SECRET_KEY; lectura solo para admin.
create policy audit_admin_read on public.audit_logs
  for select to authenticated using ((select private.get_role()) = 'admin');

-- Bucket público solo para imágenes editoriales. Subidas únicamente desde acciones de servidor autorizadas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  name = excluded.name,
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- PRIMER ADMIN: crea un usuario en Authentication > Users y después ejecuta en SQL Editor:
-- update public.profiles set role = 'admin', active = true where id = 'UUID_REAL'::uuid;
-- No añadas ninguna ruta pública para asignar privilegios.
