import { Component, Input } from "@angular/core";
import { SpellSlot } from "src/assets/models";

@Component({
  selector: "slot-tracker",
  templateUrl: "./slot-tracker.component.html",
  styleUrls: ["./slot-tracker.component.scss"]
})
export class SlotTrackerComponent {
  @Input() slot: SpellSlot = new SpellSlot;
  @Input() allowRecovery: boolean = true;

  expendSpell() {
    this.slot.slotUsed = true;
  }

  getBackgroundGradiant(spellLevel: number): string {
    var n = 0.03;
    var x = (spellLevel - 1) * n;
    return "rgba(0, 0, 0, " + x.toString() + ")";
  }

  recover() {
    if (this.slot.slotUsed) this.slot.slotUsed = false;
  }
}
