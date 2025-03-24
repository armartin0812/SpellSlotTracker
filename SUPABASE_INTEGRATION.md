# Documentation ot Supabase integration

### Authentication
- Google OAuth integration
- User session management

### Core Tables

#### 1. `users`
This table is managed by Supabase Auth.

#### 2. `characters`
```sql
create table characters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  character_id text not null,  -- Original characterID from your app
  character_name text not null,
  character_class smallint,    -- Enum value from PlayerClass
  character_level smallint not null default 0,
  current_hp smallint not null default 0,
  max_hp smallint not null default 0,
  concentrating boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Add RLS policy
  constraint unique_character_per_user unique (user_id, character_id)
);

-- RLS Policy
alter table characters enable row level security;
create policy "Users can only access their own characters"
  on characters for all
  using (auth.uid() = user_id);
```

#### 3. `spell_levels`
```sql
create table spell_levels (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  spell_level smallint not null,
  lvl_abrev text not null,
  max_slots smallint not null default 0,
  is_custom boolean not null default false,  -- To differentiate between spells and custom slots
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  lvl_name text null,
  is_recoverable boolean not null default 0,
  
  constraint unique_spell_level_per_character unique (character_id, spell_level, is_custom)
);

-- RLS Policy
alter table spell_levels enable row level security;
create policy "Users can only access spell levels for their characters"
  on spell_levels for all
  using (exists (
    select 1 from characters
    where characters.id = spell_levels.character_id
    and characters.user_id = auth.uid()
  ));
```

#### 4. `spell_slots`
```sql
create table spell_slots (
  id uuid primary key default uuid_generate_v4(),
  spell_level_id uuid references spell_levels(id) on delete cascade,
  slot_used boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS Policy
alter table spell_slots enable row level security;
create policy "Users can only access spell slots for their characters"
  on spell_slots for all
  using (exists (
    select 1 from spell_levels
    join characters on characters.id = spell_levels.character_id
    where spell_levels.id = spell_slots.spell_level_id
    and characters.user_id = auth.uid()
  ));
```

#### 5. `status_effects`
```sql
create table status_effects (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  effect text not null,
  created_at timestamp with time zone default now(),
  
  constraint unique_effect_per_character unique (character_id, effect)
);

-- RLS Policy
alter table status_effects enable row level security;
create policy "Users can only access status effects for their characters"
  on status_effects for all
  using (exists (
    select 1 from characters
    where characters.id = status_effects.character_id
    and characters.user_id = auth.uid()
  ));
```

#### 6. `death_saves`
```sql
create table death_saves (
  id uuid primary key default uuid_generate_v4(),
  character_id uuid references characters(id) on delete cascade,
  successes smallint not null default 0,
  failures smallint not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint unique_death_save_per_character unique (character_id)
);

-- RLS Policy
alter table death_saves enable row level security;
create policy "Users can only access death saves for their characters"
  on death_saves for all
  using (exists (
    select 1 from characters
    where characters.id = death_saves.character_id
    and characters.user_id = auth.uid()
  ));
```

### Database Functions and Triggers

#### Trigger for updating timestamps
```sql
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_characters_updated_at
before update on characters
for each row execute procedure update_updated_at_column();

create trigger update_spell_levels_updated_at
before update on spell_levels
for each row execute procedure update_updated_at_column();

create trigger update_spell_slots_updated_at
before update on spell_slots
for each row execute procedure update_updated_at_column();
```

#### Function for Long Rest
```sql
create or replace function long_rest(character_uuid uuid)
returns void as $$
begin
  update spell_slots
  set slot_used = false
  where spell_level_id in (
    select id from spell_levels
    where character_id = character_uuid
  );
  
  -- Reset HP and concentration
  update characters
  set current_hp = max_hp
  , concentrating = false
  where id = character_uuid;
  
  -- Reset death saves if they exist
  delete from death_saves
  where character_id = character_uuid;
end;
$$ language plpgsql;
```
