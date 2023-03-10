import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Character, SpellLevel } from "../../assets/models";

@Component({
  selector: "character-editor",
  templateUrl: "./character-editor.component.html",
  styleUrls: ["./character-editor.component.scss"]
})
export class CharacterEditorComponent {
  @Input() character: Character = new Character;
  @Output() characterChange = new EventEmitter<Character>();
  @Output() onSave = new EventEmitter<Character>();

  save() {
    this.onSave.emit(this.character);
  }

  cancel() {
    this.onSave.emit(undefined);
  }

  addCustom() {
    var slot = new SpellLevel;
    slot.spellLevel = 0;
    slot.slots = [];
    this.character.slots.push(slot);
  }

  removeCustom(s: SpellLevel) {
    var i = this.character.slots.indexOf(s);
    if (i && i >= 0) {
      this.character.slots.splice(i, 1);
    }
  }
}
