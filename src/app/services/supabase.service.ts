import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, RealtimeChannel } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { Character, SpellLevel, SpellSlot, StatusEffect } from '../../assets/models';

// Custom storage provider that doesn't use LockManager
class CustomStorageProvider {
  private storage: Storage;

  constructor(storage: 'local' | 'session' = 'local') {
    this.storage = storage === 'local' ? localStorage : sessionStorage;
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.storage.removeItem(key);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);
  public authState = this.userSubject.asObservable(); // Named to match existing code

  constructor(private router: Router) {
    const customStorage = new CustomStorageProvider('local');
    
    this.supabase = createClient(
      environment.supabase_url,
      environment.supabase_key,
      {
        auth: {
          storage: customStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );

    // Check for existing session
    this.supabase.auth.getSession().then(({ data }) => {
      console.log('Initial session check:', data?.session?.user);
      this.userSubject.next(data.session?.user || null);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user);
      this.userSubject.next(session?.user || null);
    });
  }

  async signInWithGoogle() {
    console.log('Initiating Google sign-in');
    console.log('Redirect URL:', `${window.location.origin}/auth/callback`);
    
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account' // Force Google to show the account selector
        }
      }
    });
    
    console.log('Sign-in initiated:', data);
    
    if (error) {
      console.error('Error initiating sign-in:', error);
      throw error;
    }
  }

  // async signInWithFacebook() {
  //   const { error } = await this.supabase.auth.signInWithOAuth({
  //     provider: 'facebook',
  //     options: {
  //       redirectTo: `${window.location.origin}/auth/callback`
  //     }
  //   });
    
  //   if (error) throw error;
  // }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.router.navigate(['/login']);
  }

  async handleAuthCallback(): Promise<void> {
    console.log('Handling auth callback');
    
    // First, try to extract the hash fragment from the URL
    const hashFragment = window.location.hash;
    console.log('Hash fragment:', hashFragment);
    
    if (hashFragment && hashFragment.length > 0) {
      try {
        // Process the hash fragment manually if needed
        console.log('Processing hash fragment');
        
        // The Supabase client should handle this automatically,
        // but we'll explicitly call getSession to ensure it's processed
        const { data, error } = await this.supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session after processing hash:', error);
          throw error;
        }
        
        if (data?.session) {
          console.log('Session found after processing hash:', data.session.user);
          this.userSubject.next(data.session.user);
          return;
        }
      } catch (err) {
        console.error('Error processing hash fragment:', err);
      }
    }
    
    // If we didn't get a session from the hash, try getting it directly
    const { data, error } = await this.supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      throw error;
    }
    
    if (data?.session) {
      console.log('Session found:', data.session.user);
      this.userSubject.next(data.session.user);
    } else {
      console.log('No session found');
      
      // As a last resort, try to exchange the code for a session
      // This is needed for some OAuth providers
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (code) {
        console.log('Found code in URL, attempting to exchange for session');
        try {
          // This is handled automatically by Supabase, but we'll try to force it
          await this.supabase.auth.exchangeCodeForSession(code);
          
          // Check if we have a session now
          const { data: sessionData } = await this.supabase.auth.getSession();
          if (sessionData?.session) {
            console.log('Session obtained after code exchange:', sessionData.session.user);
            this.userSubject.next(sessionData.session.user);
          }
        } catch (err) {
          console.error('Error exchanging code for session:', err);
        }
      }
    }
  }

  getUser() {
    return this.userSubject.value;
  }

  // Character management methods

  // Get all characters for the current user
  async getCharacters(): Promise<Character[]> {
    const user = this.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('characters')
      .select(`
        *,
        spell_levels:spell_levels(
          *,
          spell_slots:spell_slots(*)
        ),
        status_effects:status_effects(*)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching characters:', error);
      throw error;
    }

    // Transform the data into Character objects
    return data.map(char => this.mapDatabaseCharacterToModel(char));
  }

  // Create or update a character
  async saveCharacter(character: Character): Promise<Character | null> {
    const user = this.getUser();
    if (!user) return null;

    try {
      // Begin by upserting the character
      const { data: charData, error: charError } = await this.supabase
        .from('characters')
        .upsert({
          user_id: user.id,
          character_id: character.characterID,
          character_name: character.characterName,
          character_class: character.characterClass,
          character_level: character.characterLevel,
          current_hp: character.currentHP,
          max_hp: character.maxHP,
          concentrating: character.concentrating
        })
        .select()
        .single();

      if (charError) throw charError;

      // Save spell levels and slots
      if (character.spells && character.spells.length > 0) {
        await this.saveSpellLevels(charData.id, character.spells, false);
      }

      // Save custom slots
      if (character.slots && character.slots.length > 0) {
        await this.saveSpellLevels(charData.id, character.slots, true);
      }

      // Save status effects
      if (character.statusEffects && character.statusEffects.length > 0) {
        await this.saveStatusEffects(charData.id, character.statusEffects);
      }

      return await this.getCharacterById(charData.id);
    } catch (error) {
      console.error('Error saving character:', error);
      throw error;
    }
  }

  // Delete a character
  async deleteCharacter(characterId: string): Promise<boolean> {
    const user = this.getUser();
    if (!user) return false;

    try {
      // Find the database ID for this character
      const { data: charData, error: findError } = await this.supabase
        .from('characters')
        .select('id')
        .eq('character_id', characterId)
        .eq('user_id', user.id)
        .single();

      if (findError) throw findError;

      // Delete the character (cascade will handle related records)
      const { error: deleteError } = await this.supabase
        .from('characters')
        .delete()
        .eq('id', charData.id);

      if (deleteError) throw deleteError;
      
      return true;
    } catch (error) {
      console.error('Error deleting character:', error);
      throw error;
    }
  }

  // Perform a long rest for a character
  async performLongRest(characterId: string): Promise<boolean> {
    const user = this.getUser();
    if (!user) return false;

    try {
      // Find the database ID for this character
      const { data: charData, error: findError } = await this.supabase
        .from('characters')
        .select('id')
        .eq('character_id', characterId)
        .eq('user_id', user.id)
        .single();

      if (findError) throw findError;

      // Call the long_rest function
      const { error: restError } = await this.supabase
        .rpc('long_rest', { character_uuid: charData.id });

      if (restError) throw restError;
      
      return true;
    } catch (error) {
      console.error('Error performing long rest:', error);
      throw error;
    }
  }

  // Helper methods for saving related data
  private async saveSpellLevels(characterDbId: string, spellLevels: SpellLevel[], isCustom: boolean): Promise<void> {
    // First, get existing spell levels for this character
    const { data: existingLevels, error: fetchError } = await this.supabase
      .from('spell_levels')
      .select('*')
      .eq('character_id', characterDbId)
      .eq('is_custom', isCustom);

    if (fetchError) throw fetchError;

    // Create a map of existing levels by spell_level
    const existingMap = new Map();
    existingLevels.forEach(level => {
      existingMap.set(level.spell_level, level);
    });

    // Process each spell level
    for (const spellLevel of spellLevels) {
      let dbSpellLevel;
      
      // Check if this level already exists
      if (existingMap.has(spellLevel.spellLevel)) {
        dbSpellLevel = existingMap.get(spellLevel.spellLevel);
        
        // Update the existing spell level
        const { error: updateError } = await this.supabase
          .from('spell_levels')
          .update({
            lvl_abrev: spellLevel.lvlAbrev,
            max_slots: spellLevel.maxSlots
          })
          .eq('id', dbSpellLevel.id);
        
        if (updateError) throw updateError;
      } else {
        // Create a new spell level
        const { data: newLevel, error: insertError } = await this.supabase
          .from('spell_levels')
          .insert({
            character_id: characterDbId,
            spell_level: spellLevel.spellLevel,
            lvl_abrev: spellLevel.lvlAbrev,
            max_slots: spellLevel.maxSlots,
            is_custom: isCustom
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        dbSpellLevel = newLevel;
      }
      
      // Now handle the slots for this level
      await this.saveSpellSlots(dbSpellLevel.id, spellLevel.slots);
    }
  }

  private async saveSpellSlots(spellLevelDbId: string, slots: SpellSlot[]): Promise<void> {
    // First delete all existing slots
    const { error: deleteError } = await this.supabase
      .from('spell_slots')
      .delete()
      .eq('spell_level_id', spellLevelDbId);
    
    if (deleteError) throw deleteError;
    
    // Then insert all the new slots
    if (slots && slots.length > 0) {
      const slotsToInsert = slots.map(slot => ({
        spell_level_id: spellLevelDbId,
        slot_used: slot.slotUsed
      }));
      
      const { error: insertError } = await this.supabase
        .from('spell_slots')
        .insert(slotsToInsert);
      
      if (insertError) throw insertError;
    }
  }

  private async saveStatusEffects(characterDbId: string, effects: StatusEffect[]): Promise<void> {
    // First delete all existing effects
    const { error: deleteError } = await this.supabase
      .from('status_effects')
      .delete()
      .eq('character_id', characterDbId);
    
    if (deleteError) throw deleteError;
    
    // Then insert all the new effects
    if (effects && effects.length > 0) {
      const effectsToInsert = effects.map(effect => ({
        character_id: characterDbId,
        effect: effect.effect
      }));
      
      const { error: insertError } = await this.supabase
        .from('status_effects')
        .insert(effectsToInsert);
      
      if (insertError) throw insertError;
    }
  }

  // Get a single character by database ID
  private async getCharacterById(dbId: string): Promise<Character | null> {
    const { data, error } = await this.supabase
      .from('characters')
      .select(`
        *,
        spell_levels:spell_levels(
          *,
          spell_slots:spell_slots(*)
        ),
        status_effects:status_effects(*)
      `)
      .eq('id', dbId)
      .single();

    if (error) {
      console.error('Error fetching character by ID:', error);
      throw error;
    }

    return this.mapDatabaseCharacterToModel(data);
  }

  // Map database character to Character model
  private mapDatabaseCharacterToModel(dbChar: any): Character {
    const character = new Character();
    
    character.characterID = dbChar.character_id;
    character.characterName = dbChar.character_name;
    character.characterClass = dbChar.character_class;
    character.characterLevel = dbChar.character_level;
    character.currentHP = dbChar.current_hp;
    character.maxHP = dbChar.max_hp;
    character.concentrating = dbChar.concentrating;
    
    // Map spell levels and slots
    character.spells = [];
    character.slots = [];
    
    if (dbChar.spell_levels) {
      dbChar.spell_levels.forEach((dbLevel: any) => {
        const spellLevel = new SpellLevel();
        spellLevel.spellLevel = dbLevel.spell_level;
        spellLevel.lvlAbrev = dbLevel.lvl_abrev;
        spellLevel.maxSlots = dbLevel.max_slots;
        
        // Map slots
        spellLevel.slots = [];
        if (dbLevel.spell_slots) {
          dbLevel.spell_slots.forEach((dbSlot: any) => {
            const slot = new SpellSlot();
            slot.spellLevel = dbLevel.spell_level;
            slot.slotAbrev = dbLevel.lvl_abrev;
            slot.slotUsed = dbSlot.slot_used;
            spellLevel.slots.push(slot);
          });
        }
        
        // Add to appropriate array based on is_custom
        if (dbLevel.is_custom) {
          character.slots.push(spellLevel);
        } else {
          character.spells.push(spellLevel);
        }
      });
    }
    
    // Map status effects
    character.statusEffects = [];
    if (dbChar.status_effects) {
      dbChar.status_effects.forEach((dbEffect: any) => {
        const effect = new StatusEffect();
        effect.effect = dbEffect.effect;
        character.statusEffects.push(effect);
      });
    }
    
    return character;
  }

  // Set up real-time subscription for a user's characters
  setupCharacterSubscription(callback: (payload: any) => void): { subscription: RealtimeChannel, unsubscribe: () => void } {
    const user = this.getUser();
    if (!user) {
      throw new Error('User must be logged in to subscribe to character changes');
    }
    
    const channel = this.supabase
      .channel('public:characters')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'characters',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
    
    return {
      subscription: channel,
      unsubscribe: () => {
        this.supabase.removeChannel(channel);
      }
    };
  }
}
