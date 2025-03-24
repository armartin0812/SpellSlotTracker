import { Component, OnInit, OnDestroy } from '@angular/core';
import { Character } from "../../assets/models";
import { initializeSpellSlots } from "../../assets/functions";
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-character-list',
  standalone: false,
  templateUrl: './character-list.component.html',
  styleUrls: ['./character-list.component.scss']
})
export class CharacterListComponent implements OnInit, OnDestroy {
  
  characters: Character[] = [];
  selectedCharacter: Character | undefined;
  selectedCharacterID: string = '';
  editCharacterObj: Character | undefined;
  user: User | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  
  private subscription: { subscription: RealtimeChannel, unsubscribe: () => void } | null = null;
  
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  ngOnInit() {
    this.supabaseService.authState.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadCharacters();
        this.setupRealtimeSubscription();
      }
    });
  }
  
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  setupRealtimeSubscription() {
    try {
      this.subscription = this.supabaseService.setupCharacterSubscription((payload) => {
        // Handle real-time updates
        this.handleRealtimeUpdate(payload);
      });
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
    }
  }
  
  handleRealtimeUpdate(payload: any) {
    // Refresh the character list when changes occur
    this.loadCharacters();
  }

  async loadCharacters() {
    if (!this.user) return;
    
    this.isLoading = true;
    this.error = null;
    
    try {
      this.characters = await this.supabaseService.getCharacters();
      console.log("Characters loaded from Supabase:", this.characters.length);
      
      // If we had a selected character, try to reselect it
      if (this.selectedCharacterID) {
        this.chooseCharacter();
      }
    } catch (error) {
      console.error("Error loading characters:", error);
      this.error = "Failed to load characters. Please try again.";
    } finally {
      this.isLoading = false;
    }
  }

  createNewCharacter() {
    var newChar = new Character();
    newChar.characterID = Date.now().toString(36);
    initializeSpellSlots(newChar);
    this.editCharacter(Object.assign(newChar));
  }

  editCharacter(c: Character) {
    this.editCharacterObj = c;
  }

  async saveCharacter(c: Character) {
    if (!c) {
      this.editCharacterObj = undefined;
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    
    try {
      const savedCharacter = await this.supabaseService.saveCharacter(c);
      if (savedCharacter) {
        // Update will happen via loadCharacters() triggered by real-time subscription
        await this.loadCharacters();
      }
    } catch (error) {
      console.error("Error saving character:", error);
      this.error = "Failed to save character. Please try again.";
    } finally {
      this.isLoading = false;
      this.editCharacterObj = undefined;
    }
  }

  async deleteCharacter(c: Character) {
    if (window.confirm("Are you sure you wish to delete " + c.characterName + "?")) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const success = await this.supabaseService.deleteCharacter(c.characterID);
        if (success) {
          // Update will happen via loadCharacters() triggered by real-time subscription
          await this.loadCharacters();
          
          if (this.selectedCharacter && this.selectedCharacter.characterID === c.characterID) {
            this.selectedCharacter = undefined;
            this.selectedCharacterID = '';
          }
        }
      } catch (error) {
        console.error("Error deleting character:", error);
        this.error = "Failed to delete character. Please try again.";
      } finally {
        this.isLoading = false;
      }
    }
  }

  chooseCharacter() {
    var scope = this;
    var i = this.characters.filter(
      (x) => x.characterID === scope.selectedCharacterID
    );
    if (i && i.length > 0) {
      this.selectedCharacter = i[0];
    }
  }

  // These methods are now obsolete but kept for backward compatibility
  // They will be called from the UI but won't do anything
  updateLocalStorage() {
    console.log("updateLocalStorage called - no action needed with Supabase");
  }

  clearLocalStorage() {
    console.log("clearLocalStorage called - no action needed with Supabase");
  }
}
