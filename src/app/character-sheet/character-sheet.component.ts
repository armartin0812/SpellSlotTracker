import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from "@angular/core";
import { Character, StatusEffect } from "../../assets/models";
import { longRest, displayPlayerClass } from "../../assets/functions";
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipEditedEvent, MatChipInputEvent} from '@angular/material/chips';
import { PlayerClass } from "../../assets/models";
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: "character-sheet",
  standalone: false,
  templateUrl: "./character-sheet.component.html",
  styleUrls: ["./character-sheet.component.scss"]
})
export class CharacterSheetComponent implements OnChanges {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  @Input() character: Character = new Character;
  deathSaveSuccess1: boolean | undefined;
  deathSaveSuccess2: boolean | undefined;
  deathSaveSuccess3: boolean | undefined;
  deathSaveFail1: boolean | undefined;
  deathSaveFail2: boolean | undefined;
  deathSaveFail3: boolean | undefined;
  isLoading: boolean = false;

  constructor(
    private _cdr: ChangeDetectorRef,
    private supabaseService: SupabaseService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['character']) {
      this._cdr.detectChanges();
    }
  }
    
  displayClass(c: PlayerClass | undefined): string {
    return displayPlayerClass(c);
  }

  async longRest() {
    this.isLoading = true;
    
    try {
      // Call Supabase to perform long rest
      await this.supabaseService.performLongRest(this.character.characterID);
      
      // Update local character object
      longRest(this.character);
      this.resetDeathSaves();
    } catch (error) {
      console.error("Error performing long rest:", error);
      // Still update the UI for better user experience
      longRest(this.character);
      this.resetDeathSaves();
    } finally {
      this.isLoading = false;
      this._cdr.detectChanges();
    }
  }

  // Helper method to save character properties
  private async saveCharacterProperties() {
    try {
      await this.supabaseService.updateCharacterProperties(
        this.character.characterID, 
        {
          currentHP: this.character.currentHP,
          concentrating: this.character.concentrating
        }
      );
    } catch (error) {
      console.error('Error saving character properties:', error);
    }
  }

  async subtract10() {
    var hp = this.character.currentHP - 10;
    if (hp <= 0) {
      this.character.currentHP = 0;
      this.resetDeathSaves();
    }
    else {
      this.character.currentHP = hp;
    }
    
    // Save the HP change
    await this.saveCharacterProperties();
  }

  async add10() {
    var hp = this.character.currentHP + 10;
    if (hp >= this.character.maxHP) {
      this.character.currentHP = this.character.maxHP;
    }
    else {
      this.character.currentHP = hp;
    }
    
    // Save the HP change
    await this.saveCharacterProperties();
  }

  async subtract5() {
    var hp = this.character.currentHP - 5;
    if (hp <= 0) {
      this.character.currentHP = 0;
      this.resetDeathSaves();
    }
    else {
      this.character.currentHP = hp;
    }
    
    // Save the HP change
    await this.saveCharacterProperties();
  }

  async add5() {
    var hp = this.character.currentHP + 5;
    if (hp >= this.character.maxHP) {
      this.character.currentHP = this.character.maxHP;
    }
    else {
      this.character.currentHP = hp;
    }
    
    // Save the HP change
    await this.saveCharacterProperties();
  }

  async subtract1() {    
    var hp = this.character.currentHP - 1;
    if (hp <= 0) {
      this.character.currentHP = 0;
      this.resetDeathSaves();
    }
    else {
      this.character.currentHP = hp;
    }
    
    // Save the HP change
    await this.saveCharacterProperties();
  }

  async add1() {
    var hp = this.character.currentHP + 1;
    if (hp >= this.character.maxHP) {
      this.character.currentHP = this.character.maxHP;
    }
    else {
      this.character.currentHP = hp;
    }
    
    // Save the HP change
    await this.saveCharacterProperties();
  }

  resetDeathSaves() {
    this.deathSaveSuccess1 = undefined;
    this.deathSaveSuccess2 = undefined;
    this.deathSaveSuccess3 = undefined;
    this.deathSaveFail1 = undefined;
    this.deathSaveFail2 = undefined;
    this.deathSaveFail3 = undefined;
    this.character.concentrating = false;
  }

  // Helper method to save status effects
  private async saveStatusEffects() {
    try {
      await this.supabaseService.updateStatusEffects(
        this.character.characterID,
        this.character.statusEffects
      );
    } catch (error) {
      console.error('Error saving status effects:', error);
    }
  }

  async addEffect(event: MatChipInputEvent) {
    var value = (event.value || '').trim();

    if (!this.character.statusEffects){
      this.character.statusEffects = [];
    }

    if (value) {
      this.character.statusEffects.push({effect: value});
      
      // Save the updated status effects
      await this.saveStatusEffects();
    }
    
    event.chipInput!.clear();
  }

  async editEffect(e: StatusEffect, event: MatChipEditedEvent) {
    var value = event.value.trim();

    // Remove if it no longer has a value
    if (!value) {
      await this.removeEffect(e);
      return;
    }

    // Edit existing
    var i = this.character.statusEffects.indexOf(e);
    if (i >= 0) {
      this.character.statusEffects[i].effect = value;
      
      // Save the updated status effects
      await this.saveStatusEffects();
    }
  }

  async removeEffect(fruit: StatusEffect) {
    var i = this.character.statusEffects.indexOf(fruit);

    if (i >= 0) {
      this.character.statusEffects.splice(i, 1);
      
      // Save the updated status effects
      await this.saveStatusEffects();
    }
  }

  // Method to handle concentration changes
  async onConcentrationChange() {
    await this.saveCharacterProperties();
  }
}
