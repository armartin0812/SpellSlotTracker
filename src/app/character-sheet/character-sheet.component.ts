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
  styleUrls: ["./character-sheet.component.css"]
})
export class CharacterSheetComponent implements OnChanges {
  @Input() character: Character;

  constructor(private _cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.character) {
      longRest(this.character);
      this._cdr.detectChanges();
    }
  }

  longRest() {
    longRest(this.character);
    this._cdr.detectChanges();
  }
}
