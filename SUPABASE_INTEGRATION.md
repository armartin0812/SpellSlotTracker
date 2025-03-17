# Modifications Needed to Use Supabase Instead of Local Storage

## Progress So Far

✅ **Authentication Implementation Complete**
- Supabase client library installed
- Authentication service created
- Google OAuth integration implemented
- User session management implemented

## Remaining Tasks to Migrate from Local Storage to Supabase

### 1. Database Setup in Supabase

1. **Create Tables**:
   - `characters` table with columns matching your Character model
   - Consider normalized tables for related data like `spell_levels` and `status_effects`

2. **Set Up Row Level Security (RLS)**:
   - Configure RLS policies to ensure users can only access their own data
   - Example policy for characters table:
     ```sql
     create policy "Users can only access their own characters"
       on characters for all
       using (auth.uid() = user_id);
     ```

### 2. Code Modifications for Data Storage

#### CharacterListComponent Changes

Replace local storage methods with Supabase operations:

1. **Loading Characters**:
   ```typescript
   async loadCharacters() {
     const { data, error } = await this.supabaseService.supabase
       .from('characters')
       .select('*')
       .eq('user_id', this.supabaseService.getUser()?.id);
     
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
     const { data, error } = await this.supabaseService.supabase
       .from('characters')
       .upsert({
         characterID: character.characterID,
         user_id: this.supabaseService.getUser()?.id,
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
       const { data, error } = await this.supabaseService.supabase
         .from('characters')
         .delete()
         .eq('characterID', c.characterID)
         .eq('user_id', this.supabaseService.getUser()?.id);
       
       // Update local array after successful deletion
       if (!error) {
         var i = this.characters.indexOf(c);
         this.characters.splice(i, 1);
         this.selectedCharacter = undefined;
       }
     }
   }
   ```

### 3. Data Synchronization

1. **Real-time Updates**:
   - Implement Supabase real-time subscriptions for live updates
   ```typescript
   // In CharacterListComponent
   setupRealtimeSubscription() {
     this.subscription = this.supabaseService.supabase
       .channel('public:characters')
       .on('postgres_changes', 
         { 
           event: '*', 
           schema: 'public', 
           table: 'characters',
           filter: `user_id=eq.${this.supabaseService.getUser()?.id}`
         }, 
         (payload) => {
           // Handle real-time updates
           this.handleRealtimeUpdate(payload);
         }
       )
       .subscribe();
   }

   // Don't forget to unsubscribe in ngOnDestroy
   ngOnDestroy() {
     if (this.subscription) {
       this.supabaseService.supabase.removeChannel(this.subscription);
     }
   }
   ```

### 4. Error Handling and Loading States

1. **Add Loading States**:
   - Show loading indicators during data operations
   - Handle network connectivity issues

2. **Error Handling**:
   - Implement comprehensive error handling for database operations
   - Add user-friendly error messages

### 5. Migration Strategy

Because the application has not yet been released to the public, there is no need to implement any sort of data migration from local storage to Supabase storage.

## 6. Suggested Database Schema

Based on the existing Character model and related classes, here's a normalized database schema design for Supabase:

### Core Tables

#### 1. `users`
This table is already created and managed by Supabase Auth.

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

## 7. Next Steps

1. **Create Database Tables**: Set up the tables in Supabase according to the schema above
2. **Update SupabaseService**: Add methods for character CRUD operations
3. **Modify CharacterListComponent**: Replace local storage with Supabase calls
4. **Implement Migration**: Add code to migrate existing local data to Supabase
5. **Add Real-time Updates**: Implement subscriptions for live updates
6. **Test Thoroughly**: Ensure all functionality works with the new storage system
