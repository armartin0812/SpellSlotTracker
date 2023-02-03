import { Component, Input } from "@angular/core";
import { SpellSlot } from "src/assets/models";

@Component({
  selector: "slot-tracker",
  templateUrl: "./slot-tracker.component.html",
  styleUrls: ["./slot-tracker.component.css"]
})
export class SlotTrackerComponent {
  @Input() slot: SpellSlot;
}
