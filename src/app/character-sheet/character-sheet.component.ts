import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from "@angular/core";
import { Character } from "../../assets/models";
import { longRest } from "../../assets/functions";

@Component({
  selector: "character-sheet",
  templateUrl: "./character-sheet.component.html",
  styleUrls: ["./character-sheet.component.scss"]
})
export class CharacterSheetComponent implements OnChanges {
  @Input() character: Character = new Character;
  deathSave1: boolean | undefined;
  deathSave2: boolean | undefined;
  deathSave3: boolean | undefined;

  constructor(private _cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['character']) {
      longRest(this.character);
      this._cdr.detectChanges();
    }
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
    this.deathSave1 = undefined;
    this.deathSave2 = undefined;
    this.deathSave3 = undefined;
  }
}
