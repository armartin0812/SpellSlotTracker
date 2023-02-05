import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Character } from "../../assets/models";

@Component({
  selector: "character-sheet",
  templateUrl: "./character-sheet.component.html",
  styleUrls: ["./character-sheet.component.css"]
})
export class CharacterSheetComponent implements OnChanges {
  @Input() character: Character;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.Character) {
      this.initializeSlots(false);
    }
  }

  initializeSlots(notify: boolean) {
    this.character.initializeSpellSlots();

    this.longRest(notify);
  }

  longRest(notify: boolean) {
    this.character.longRest();
    if (notify) alert("long rest achieved!");
  }
}
