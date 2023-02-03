import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { SlotTrackerComponent } from "../app/slot-tracker/slot-tracker.component";

@NgModule({
  declarations: [AppComponent, SlotTrackerComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
