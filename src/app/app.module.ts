import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { FormsModule } from "@angular/forms";
import { CdkMenuModule } from "@angular/cdk/menu";
import { SlotTrackerComponent } from "./slot-tracker/slot-tracker.component";

@NgModule({
  declarations: [AppComponent, SlotTrackerComponent],
  imports: [BrowserModule, FormsModule, CdkMenuModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
