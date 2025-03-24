import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Character, SpellLevel } from "../../assets/models";

@Component({
  selector: "character-editor",
  standalone: false,
  templateUrl: "./character-editor.component.html",
  styleUrls: ["./character-editor.component.scss"]
})
export class CharacterEditorComponent {
  @Input() character: Character = new Character;
  @Output() characterChange = new EventEmitter<Character>();
  @Output() onSave = new EventEmitter<Character>();
  
  // Add a property to track validation errors
  abrevError: string = '';

  save() {
    // Validate before saving
    if (this.validateCustomTrackers()) {
      this.onSave.emit(this.character);
    }
  }

  cancel() {
    this.onSave.emit(undefined);
  }

  addCustom() {
    // Find the lowest (most negative) spell_level value among existing custom trackers
    let minLevel = -1;
    if (this.character.slots && this.character.slots.length > 0) {
      minLevel = Math.min(...this.character.slots.map(s => s.spellLevel));
      // If minLevel is already negative, decrement it further
      if (minLevel < 0) {
        minLevel = minLevel - 1;
      }
    }
    
    var slot = new SpellLevel();
    slot.spellLevel = minLevel; // Use a negative value
    slot.lvlName = '';
    slot.lvlAbrev = '';
    slot.slots = [];
    slot.recoverable = true; // Set default to true
    this.character.slots.push(slot);
    this.characterChange.emit(this.character);
  }

  removeCustom(s: SpellLevel) {
    var i = this.character.slots.indexOf(s);
    if (i !== undefined && i >= 0) {
      this.character.slots.splice(i, 1);
      this.characterChange.emit(this.character);
      this.validateCustomTrackers(); // Re-validate after removal
    }
  }

  // Add a method to validate abbreviation changes
  validateAbrev(spellLevel: SpellLevel) {
    // Clear previous error
    this.abrevError = '';
    
    // Check if the abbreviation is empty
    if (!spellLevel.lvlAbrev.trim()) {
      this.abrevError = 'Abbreviation cannot be empty';
      return false;
    }
    
    // Check for duplicates in spells array
    const spellDuplicate = this.character.spells.find(
      s => s !== spellLevel && s.lvlAbrev === spellLevel.lvlAbrev
    );
    
    // Check for duplicates in slots array
    const slotDuplicate = this.character.slots.find(
      s => s !== spellLevel && s.lvlAbrev === spellLevel.lvlAbrev
    );
    
    if (spellDuplicate || slotDuplicate) {
      this.abrevError = `Abbreviation "${spellLevel.lvlAbrev}" is already in use`;
      return false;
    }
    
    return true;
  }

  // Add a method to validate all custom trackers before saving
  validateCustomTrackers(): boolean {
    // Check for empty abbreviations
    const emptyAbrev = this.character.slots.find(s => !s.lvlAbrev.trim());
    if (emptyAbrev) {
      this.abrevError = 'All custom trackers must have an abbreviation';
      return false;
    }
    
    // Check for duplicate abbreviations
    const abrevs = new Set<string>();
    
    // Add all spell abbreviations to the set
    for (const spell of this.character.spells) {
      abrevs.add(spell.lvlAbrev);
    }
    
    // Check for duplicates in custom trackers
    for (const slot of this.character.slots) {
      if (abrevs.has(slot.lvlAbrev)) {
        this.abrevError = `Abbreviation "${slot.lvlAbrev}" is used multiple times`;
        return false;
      }
      abrevs.add(slot.lvlAbrev);
    }
    
    this.abrevError = '';
    return true;
  }
}
