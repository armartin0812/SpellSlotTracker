import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Character } from "../../assets/models";

@Component({
  selector: "character-editor",
  templateUrl: "./character-editor.component.html",
  styleUrls: ["./character-editor.component.css"]
})
export class CharacterEditorComponent {
  @Input() character: Character;
  @Output() onSave = new EventEmitter<Character>();

  save() {
    this.onSave.emit(this.character);
  }

  cancel() {
    this.onSave.emit(undefined);
  }
}
