import { Component, OnInit } from '@angular/core';
import { faCloud, faMagicWandSparkles, faListCheck } from '@fortawesome/free-solid-svg-icons';
import { initializeSpellSlots } from "src/assets/functions";
import { Character } from "../assets/models";
import { SocialAuthService, SocialUser } from "angularx-social-login";
import { FacebookLoginProvider, GoogleLoginProvider } from "angularx-social-login";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  //Font Awesome icons
  faCloud = faCloud;
  faMagicWandSparkles = faMagicWandSparkles;
  faListCheck = faListCheck;
  
  title = 'Spell Slot Tracker';
  characters: Character[] = [];
  selectedCharacter: Character | undefined;
  selectedCharacterID: string = '';
  editCharacterObj: Character | undefined;
    
  user: SocialUser | undefined;
  loggedIn: boolean = false;

  constructor(private authService: SocialAuthService) { }

   ngOnInit() {
    this.authService.authState.subscribe((user) => {
        this.user = user;
        this.loggedIn = (user != null);
    });
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

  signInWithFB(): void {
    this.authService.signIn(FacebookLoginProvider.PROVIDER_ID);
  }

  signOut(): void {
    this.authService.signOut();
  }

  refreshToken(): void {
    this.authService.refreshAuthToken(GoogleLoginProvider.PROVIDER_ID);
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
    this.clearLocalStorage();
    console.log("Characters Saved");
    console.log(JSON.stringify(this.characters));
    try {
      localStorage.setItem(
        "SpellSlotTracker-Characters",
        JSON.stringify(this.characters)
      );
    } catch (e) {
      console.log("Local Storage save operation failed: " + e);
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
