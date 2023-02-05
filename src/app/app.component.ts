import { Component, OnInit } from "@angular/core";
import { Character } from "../assets/models";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  title = "Slot Tracker App";
  characters: Character[];
  selectedCharacter: Character;
  editCharacterObj: Character;

  ngOnInit() {
    this.characters = [];
    //check local storage for any saved Characters
    try {
      var store = localStorage.getItem("SpellSlotTracker-Characters");
      if (store && store.length > 0) {
        this.characters = JSON.parse(store);
      }
    } catch (e) {
      console.log("No Local Storage found");
    }
  }

  createNewCharacter() {
    var newChar = new Character();
    newChar.initializeSpellSlots();
    this.characters.push(Object.assign(Object.assign(newChar)));
    this.editCharacter(this.characters[this.characters.length - 1]);
  }

  editCharacter(c: Character) {
    this.editCharacterObj = c;
  }

  saveCharacter(c: Character) {
    this.updateLocalStorage();
    this.editCharacterObj = undefined;
  }

  deleteCharacter(c: Character) {
    var i = this.characters.indexOf(c);
    this.characters.splice(i, 1);
    this.editCharacterObj = undefined;
    this.updateLocalStorage();
  }

  updateLocalStorage() {
    try {
      localStorage.setItem(
        "SpellSlotTracker-Characters",
        JSON.stringify(this.characters)
      );
    } catch (e) {
      console.log("Local Storage save operation failed: " + e.message);
    }
  }
}
