# Modifications Needed to Use Supabase Instead of Local Storage

To migrate from browser local storage to Supabase for character data storage, you would need to make the following modifications:

## 1. Setup and Configuration

1. **Install Supabase Client Library**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Initialize Supabase Client**:
   - Create a service or provider to initialize and manage the Supabase connection
   - Add environment variables for Supabase URL and API key

## 2. Database Setup in Supabase

1. **Create Tables**:
   - `characters` table with columns matching your Character model
   - Consider normalized tables for related data like `spell_levels` and `status_effects`

2. **Set Up Authentication**:
   - Configure authentication providers in Supabase dashboard
   - Set up Row Level Security (RLS) policies to ensure users can only access their own data

## 3. Code Modifications

### AppComponent Changes

Replace local storage methods with Supabase operations:

1. **Loading Characters**:
   ```typescript
   async loadCharacters() {
     const { data, error } = await this.supabaseService.from('characters')
       .select('*')
       .eq('user_id', this.authService.currentUser.id);
     
     if (data) {
       this.characters = data.map(char => {
         // Transform database record to Character object
         return Object.assign(new Character(), char);
       });
     }
   }
   ```

2. **Saving Characters**:
   ```typescript
   async updateCharacter(character: Character) {
     const { data, error } = await this.supabaseService.from('characters')
       .upsert({
         characterID: character.characterID,
         user_id: this.authService.currentUser.id,
         characterName: character.characterName,
         // Other character properties
         updated_at: new Date()
       });
   }
   ```

3. **Deleting Characters**:
   ```typescript
   async deleteCharacter(c: Character) {
     if (window.confirm("Are you sure you wish to delete " + c.characterName + "?")) {
       const { data, error } = await this.supabaseService.from('characters')
         .delete()
         .eq('characterID', c.characterID)
         .eq('user_id', this.authService.currentUser.id);
       
       // Update local array after successful deletion
       if (!error) {
         var i = this.characters.indexOf(c);
         this.characters.splice(i, 1);
         this.selectedCharacter = undefined;
       }
     }
   }
   ```

### Authentication Integration

1. **User Authentication**:
   - Integrate Supabase auth with your existing auth service
   - Store user ID with each character record
   - Filter character queries by user ID

2. **Session Management**:
   - Handle Supabase session state
   - Implement token refresh logic

### Data Synchronization

1. **Real-time Updates**:
   - Implement Supabase real-time subscriptions for live updates
   ```typescript
   this.supabaseService
     .from('characters')
     .on('*', payload => {
       // Handle real-time updates
     })
     .subscribe();
   ```

2. **Offline Support** (optional):
   - Implement caching strategy
   - Add conflict resolution for offline changes

## 4. Error Handling and Loading States

1. **Add Loading States**:
   - Show loading indicators during data operations
   - Handle network connectivity issues

2. **Error Handling**:
   - Implement comprehensive error handling for database operations
   - Add user-friendly error messages

## 5. Migration Strategy

1. **Data Migration**:
   - Add functionality to migrate existing local storage data to Supabase
   - Consider a one-time migration process for existing users

2. **Phased Rollout**:
   - Implement feature flags to gradually roll out the new storage solution
   - Consider a fallback to local storage if Supabase operations fail

This approach would transform your application from a client-side only storage solution to a full-stack application with persistent cloud storage, multi-device access, and proper user authentication.

## 6. Suggested Database Schema

Based on the existing Character model and related classes, here's a normalized database schema design for Supabase:

### Core Tables

#### 1. `users`
This table will be automatically created by Supabase Auth.
```sql
-- Created and managed by Supabase Auth
id uuid primary key
email text
```

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

### Additional Tables (Optional)

#### 6. `death_saves` (Optional)
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

### Notes on the Schema Design

1. **Primary Keys**: Using UUIDs for all primary keys to ensure global uniqueness.

2. **Foreign Keys**: Proper relationships between tables with cascade delete where appropriate.

3. **Row Level Security**: Each table has RLS policies to ensure users can only access their own data.

4. **Normalization**: The schema is normalized to reduce redundancy:
   - Characters table contains basic character information
   - Spell levels are separated into their own table
   - Spell slots are linked to spell levels
   - Status effects are in their own table

5. **Timestamps**: Created and updated timestamps for tracking changes.

6. **Unique Constraints**: Ensuring no duplicates for critical relationships.
