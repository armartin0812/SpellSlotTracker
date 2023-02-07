import { Component, OnInit } from "@angular/core";
import { filter } from "rxjs";
import { initializeSpellSlots } from "src/assets/functions";
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
  selectedCharacterID: string;
  editCharacterObj: Character;

  ngOnInit() {
    this.characters = [];
    //check local storage for any saved Characters
    try {
      var store = localStorage.getItem("SpellSlotTracker-Characters");
      if (store && store.length > 0) {
        console.log("Characters Recovered!");
        console.log(JSON.parse(store));
        this.characters = JSON.parse(store);
      }
    } catch (e) {
      console.log("No Local Storage found");
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

  saveCharacter(c: Character) {
    if (c) {
      this.characters.push(Object.assign(c));
      this.updateLocalStorage();
    }
    this.editCharacterObj = undefined;
  }

  deleteCharacter(c: Character) {
    if (
      window.confirm("Are you sure you wish to delete " + c.characterName + "?")
    ) {
      var i = this.characters.indexOf(c);
      this.characters.splice(i, 1);
      this.editCharacterObj = undefined;
      this.selectedCharacter = undefined;
      this.updateLocalStorage();
    }
  }

  chooseCharacter() {
    var scope = this;
    var i = this.characters.filter(
      (x) => x.characterID === scope.selectedCharacterID
    );
    if (filter && filter.length > 0) {
      this.selectedCharacter = i[0];
    }
  }

  updateLocalStorage() {
    console.log("Characters Saved");
    console.log(JSON.stringify(this.characters));
    try {
      localStorage.setItem(
        "SpellSlotTracker-Characters",
        JSON.stringify(this.characters)
      );
    } catch (e) {
      console.log("Local Storage save operation failed: " + e.message);
    }
  }

  clearLocalStorage() {
    try {
      localStorage.clear();
    } catch (e) {
      console.log("Local Storage clear operation failed");
    }
  }
}
