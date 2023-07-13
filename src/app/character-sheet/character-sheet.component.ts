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

@Component({
  selector: "character-sheet",
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

  constructor(private _cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['character']) {
      longRest(this.character);
      this._cdr.detectChanges();
    }
  }
    
  displayClass(c: PlayerClass): string {
    return displayPlayerClass(c);
  }

  longRest() {
    longRest(this.character);
    this.resetDeathSaves();
    this._cdr.detectChanges();
  }

  subtract10() {
    var hp = this.character.currentHP - 10;
    if (hp <= 0) {
      this.character.currentHP = 0;
      this.resetDeathSaves();
    }
    else {
      this.character.currentHP = hp;
    }
  }

  add10() {
    var hp = this.character.currentHP + 10;
    if (hp >= this.character.maxHP) {
      this.character.currentHP = this.character.maxHP;
    }
    else {
      this.character.currentHP = hp;
    }
  }

  subtract5() {
    var hp = this.character.currentHP - 5;
    if (hp <= 0) {
      this.character.currentHP = 0;
      this.resetDeathSaves();
    }
    else {
      this.character.currentHP = hp;
    }
  }

  add5() {
    var hp = this.character.currentHP + 5;
    if (hp >= this.character.maxHP) {
      this.character.currentHP = this.character.maxHP;
    }
    else {
      this.character.currentHP = hp;
    }
  }

  subtract1() {    
    var hp = this.character.currentHP - 1;
    if (hp <= 0) {
      this.character.currentHP = 0;
      this.resetDeathSaves();
    }
    else {
      this.character.currentHP = hp;
    }
  }

  add1() {
    var hp = this.character.currentHP + 1;
    if (hp >= this.character.maxHP) {
      this.character.currentHP = this.character.maxHP;
    }
    else {
      this.character.currentHP = hp;
    }
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

  addEffect(event: MatChipInputEvent) {
    var value = (event.value || '').trim();

    if (!this.character.statusEffects){
      this.character.statusEffects = [];
    }

    if (value) {
      this.character.statusEffects.push({effect: value});
    }
    
    event.chipInput!.clear();
  }

  editEffect(e: StatusEffect, event: MatChipEditedEvent) {
    var value = event.value.trim();

    // Remove if it no longer has a value
    if (!value) {
      this.removeEffect(e);
      return;
    }

    // Edit existing
    var i = this.character.statusEffects.indexOf(e);
    if (i >= 0) {
      this.character.statusEffects[i].effect = value;
    }
  }

  removeEffect(fruit: StatusEffect): void {
    var i = this.character.statusEffects.indexOf(fruit);

    if (i >= 0) {
      this.character.statusEffects.splice(i, 1);
    }
  }
}
