import { Component, Input } from "@angular/core";
import { SpellSlot } from "src/assets/models";
import { SupabaseService } from "../services/supabase.service";

@Component({
  selector: "slot-tracker",
  standalone: false,
  templateUrl: "./slot-tracker.component.html",
  styleUrls: ["./slot-tracker.component.scss"]
})
export class SlotTrackerComponent {
  @Input() slot: SpellSlot = new SpellSlot;
  @Input() allowRecovery: boolean = true;
  @Input() characterId: string = '';
  @Input() spellLevel: number = 0;
  @Input() slotIndex: number = 0;
  @Input() isCustom: boolean = false;

  constructor(private supabaseService: SupabaseService) { }

  async expendSpell() {
    this.slot.slotUsed = true;
    
    // Save the change to Supabase if we have the necessary info
    if (this.characterId && this.spellLevel !== undefined) {
      try {
        await this.supabaseService.updateSpellSlot(
          this.characterId,
          this.spellLevel,
          this.slotIndex,
          true,
          this.isCustom
        );
      } catch (error) {
        console.error('Error updating spell slot:', error);
      }
    }
  }

  getBackgroundGradiant(spellLevel: number): string {
    var n = 0.03;
    var x = (spellLevel - 1) * n;
    return "rgba(0, 0, 0, " + x.toString() + ")";
  }

  async recover() {
    if (this.allowRecovery && this.slot.slotUsed) {
      this.slot.slotUsed = false;
      
      // Save the change to Supabase if we have the necessary info
      if (this.characterId && this.spellLevel !== undefined) {
        try {
          await this.supabaseService.updateSpellSlot(
            this.characterId,
            this.spellLevel,
            this.slotIndex,
            false,
            this.isCustom
          );
        } catch (error) {
          console.error('Error updating spell slot:', error);
        }
      }
    }
  }
}
