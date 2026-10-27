create table users (
  id uuid primary key default gen_random_uuid(),
  role text not null unique check (role in ('sleeper','partner')),
  name text not null check (length(name) between 1 and 50),
  token_hash text not null unique,
  sharing_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table invites (
  code text primary key,
  expires_at timestamptz not null,
  used_at timestamptz,
  attempts int not null default 0
);

create table sleep_logs (
  user_id uuid not null references users(id) on delete cascade,
  date date not null,
  bed_time timestamptz not null,
  wake_time timestamptz not null check (wake_time > bed_time),
  latency_min int not null check (latency_min between 0 and 600),
  awakenings int not null check (awakenings between 0 and 30),
  awake_min int not null default 0 check (awake_min between 0 and 600),
  rating smallint not null check (rating between 1 and 5),
  note text check (length(note) <= 500),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'goodnight' check (kind in ('goodnight','scene','word')),
  text text not null check (length(text) between 1 and 2000),
  show_on_date date,
  check (kind <> 'goodnight' or show_on_date is not null),
  created_at timestamptz not null default now()
);
