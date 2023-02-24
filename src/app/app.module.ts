import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from "@angular/forms";
import { CdkMenuModule } from "@angular/cdk/menu";
import { SlotTrackerComponent } from "./slot-tracker/slot-tracker.component";
import { CharacterSheetComponent } from "./character-sheet/character-sheet.component";
import { CharacterEditorComponent } from "./character-editor/character-editor.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap"
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips'

@NgModule({
  declarations: [
    AppComponent,
    SlotTrackerComponent,
    CharacterSheetComponent,
    CharacterEditorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    FormsModule, 
    CdkMenuModule,
    MatSlideToggleModule,
    MatRadioModule,
    NgbModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatChipsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
