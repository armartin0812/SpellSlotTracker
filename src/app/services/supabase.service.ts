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
    
    // Make sure we're using the correct redirect URL format for hash-based routing
    const baseUrl = window.location.href.replace(window.location.hash, '');
    const redirectUrl = `${baseUrl}/#/auth/callback`;
    console.log('Redirect URL:', redirectUrl);
    
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
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
    
    // For hash-based routing, we need to check if we have auth parameters in the hash
    const fullUrl = window.location.href;
    
    // Check if we're on the callback page with potential auth parameters
    if (fullUrl.includes('#/auth/callback')) {
      try {
        // Use the current method for getting session from URL
        // In newer versions, this is handled automatically by detectSessionInUrl
        // We'll just check if we have a session after the redirect
        const { data, error } = await this.supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        
        if (data?.session) {
          console.log('Session obtained after redirect:', data.session.user);
          this.userSubject.next(data.session.user);
          return;
        }
        
        // If we don't have a session yet, try to extract hash parameters
        // This is a fallback for older versions or specific scenarios
        const hashParams = new URLSearchParams(
          fullUrl.substring(fullUrl.indexOf('#/auth/callback') + '#/auth/callback'.length).replace('#','?')
        );
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('Found tokens in URL, setting session manually');
          const { data: sessionData, error: sessionError } = await this.supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            console.error('Error setting session:', sessionError);
            throw sessionError;
          }
          
          if (sessionData?.user) {
            console.log('Session set manually:', sessionData.user);
            this.userSubject.next(sessionData.user);
            return;
          }
        }
      } catch (err) {
        console.error('Error processing auth callback URL:', err);
      }
    }
    
    // If we didn't get a session from the URL, try getting it directly
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
        }, {
          onConflict: 'user_id,character_id'  // Specify the fields that make up your unique constraint
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
    // Get existing spell levels first
    const { data: existingLevels, error: fetchError } = await this.supabase
      .from('spell_levels')
      .select('id, spell_level')
      .eq('character_id', characterDbId)
      .eq('is_custom', isCustom);

    if (fetchError) throw fetchError;

    // If there are no spell levels to save, delete all existing ones
    if (spellLevels.length === 0) {
      if (existingLevels && existingLevels.length > 0) {
        const { error: deleteError } = await this.supabase
          .from('spell_levels')
          .delete()
          .eq('character_id', characterDbId)
          .eq('is_custom', isCustom);
        
        if (deleteError) throw deleteError;
      }
      return;
    }

    // Identify levels to keep and levels to delete
    const newLevelValues = spellLevels.map(s => s.spellLevel);
    const levelsToDelete = existingLevels
      ? existingLevels.filter(level => !newLevelValues.includes(level.spell_level))
      : [];

    // Delete levels that are no longer needed
    if (levelsToDelete.length > 0) {
      const levelIdsToDelete = levelsToDelete.map(level => level.id);
      const { error: deleteError } = await this.supabase
        .from('spell_levels')
        .delete()
        .in('id', levelIdsToDelete);
      
      if (deleteError) throw deleteError;
    }

    // Prepare data for upsert
    const spellLevelsToUpsert = spellLevels.map(spellLevel => ({
      character_id: characterDbId,
      spell_level: spellLevel.spellLevel,
      lvl_abrev: spellLevel.lvlAbrev,
      max_slots: spellLevel.maxSlots,
      is_custom: isCustom,
      lvl_name: spellLevel.lvlName,
      is_recoverable: spellLevel.recoverable
    }));

    // Upsert all spell levels at once
    const { data: upsertedLevels, error: upsertError } = await this.supabase
      .from('spell_levels')
      .upsert(spellLevelsToUpsert, {
        onConflict: 'character_id,spell_level,is_custom'
      })
      .select();

    if (upsertError) throw upsertError;

    // Now handle the slots for each level
    for (const spellLevel of spellLevels) {
      // Find the corresponding upserted level
      const dbSpellLevel = upsertedLevels.find(
        level => level.spell_level === spellLevel.spellLevel && level.is_custom === isCustom
      );
      
      if (dbSpellLevel) {
        await this.saveSpellSlots(dbSpellLevel.id, spellLevel.slots);
      }
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
        spellLevel.lvlName = dbLevel.lvl_name;
        spellLevel.recoverable = dbLevel.is_recoverable;
        
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

  // Update character properties (HP, concentration)
  async updateCharacterProperties(characterId: string, properties: Partial<{
    currentHP: number;
    concentrating: boolean;
  }>): Promise<boolean> {
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

      // Update only the specified properties
      const updateData: any = {};
      if (properties.currentHP !== undefined) updateData.current_hp = properties.currentHP;
      if (properties.concentrating !== undefined) updateData.concentrating = properties.concentrating;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await this.supabase
          .from('characters')
          .update(updateData)
          .eq('id', charData.id);

        if (updateError) throw updateError;
      }

      return true;
    } catch (error) {
      console.error('Error updating character properties:', error);
      throw error;
    }
  }

  // Update a single spell slot
  async updateSpellSlot(characterId: string, spellLevel: number, slotIndex: number, isUsed: boolean, isCustom: boolean = false): Promise<boolean> {
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

      // Find the spell level
      const { data: levelData, error: levelError } = await this.supabase
        .from('spell_levels')
        .select('id')
        .eq('character_id', charData.id)
        .eq('spell_level', spellLevel)
        .eq('is_custom', isCustom)
        .single();

      if (levelError) throw levelError;

      // Get all slots for this spell level
      const { data: slotsData, error: slotsError } = await this.supabase
        .from('spell_slots')
        .select('id')
        .eq('spell_level_id', levelData.id)
        .order('id', { ascending: true });

      if (slotsError) throw slotsError;

      // Make sure the slot index is valid
      if (slotIndex < 0 || slotIndex >= slotsData.length) {
        throw new Error(`Invalid slot index: ${slotIndex}`);
      }

      // Update the specific slot
      const { error: updateError } = await this.supabase
        .from('spell_slots')
        .update({ slot_used: isUsed })
        .eq('id', slotsData[slotIndex].id);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error updating spell slot:', error);
      throw error;
    }
  }

  // Update status effects
  async updateStatusEffects(characterId: string, statusEffects: StatusEffect[]): Promise<boolean> {
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

      // Save the status effects
      await this.saveStatusEffects(charData.id, statusEffects);
      
      return true;
    } catch (error) {
      console.error('Error updating status effects:', error);
      throw error;
    }
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
