import { Component, OnInit } from '@angular/core';
import { Character } from "../../assets/models";
import { initializeSpellSlots } from "../../assets/functions";
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-character-list',
  standalone: false,
  templateUrl: './character-list.component.html',
  styleUrls: ['./character-list.component.scss']
})
export class CharacterListComponent implements OnInit {
  
  characters: Character[] = [];
  selectedCharacter: Character | undefined;
  selectedCharacterID: string = '';
  editCharacterObj: Character | undefined;
  user: User | null = null;
  
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
    ) { }

  ngOnInit() {
    this.supabaseService.authState.subscribe(user => {
      this.user = user;
      this.loadCharacters();
    });
  }

  loadCharacters() {
    if (!this.user) return;
    
    try {
      const key = `SpellSlotTracker-Characters-${this.user.id}`;
      var store = localStorage.getItem(key);
      if (store && store.length > 0) {
        console.log("Characters Recovered!");
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
      var i = this.characters.map(x => x.characterID).indexOf(c.characterID);
      if (i == -1)
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
    if (i && i.length > 0) {
      this.selectedCharacter = i[0];
    }
  }

  updateLocalStorage() {
    if (!this.user) return;
    
    this.clearLocalStorage();
    console.log("Characters Saved");
    try {
      const key = `SpellSlotTracker-Characters-${this.user.id}`;
      localStorage.setItem(key, JSON.stringify(this.characters));
    } catch (e) {
      console.log("Local Storage save operation failed: " + e);
    }
  }

  clearLocalStorage() {
    if (!this.user) return;
    
    try {
      const key = `SpellSlotTracker-Characters-${this.user.id}`;
      localStorage.removeItem(key);
    } catch (e) {
      console.log("Local Storage clear operation failed");
    }
  }
}
