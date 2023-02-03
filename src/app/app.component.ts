import { Component, OnInit } from "@angular/core";
import { SpellLevel, SpellSlot } from "../assets/models";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  title = "Slot Tracker App";
  slots: SpellLevel[];

  ngOnInit() {
    this.initializeSlots();
  }

  initializeSlots() {
    this.slots = [];
    var lvl1: SpellLevel = new SpellLevel();
    lvl1.lvlName = "Lvl 1";
    lvl1.maxSlots = 0;
    lvl1.slots = [];
    this.slots.push(lvl1);

    var lvl2: SpellLevel = new SpellLevel();
    lvl2.lvlName = "Lvl 2";
    lvl2.maxSlots = 0;
    lvl2.slots = [];
    this.slots.push(lvl2);

    var lvl3: SpellLevel = new SpellLevel();
    lvl3.lvlName = "Lvl 3";
    lvl3.maxSlots = 0;
    lvl3.slots = [];
    this.slots.push(lvl3);

    var lvl4: SpellLevel = new SpellLevel();
    lvl4.lvlName = "Lvl 4";
    lvl4.maxSlots = 0;
    lvl4.slots = [];
    this.slots.push(lvl4);

    var lvl5: SpellLevel = new SpellLevel();
    lvl5.lvlName = "Lvl 5";
    lvl5.maxSlots = 0;
    lvl5.slots = [];
    this.slots.push(lvl5);

    var lvl6: SpellLevel = new SpellLevel();
    lvl6.lvlName = "Lvl 6";
    lvl6.maxSlots = 0;
    lvl6.slots = [];
    this.slots.push(lvl6);

    var lvl7: SpellLevel = new SpellLevel();
    lvl7.lvlName = "Lvl 7";
    lvl7.maxSlots = 0;
    lvl7.slots = [];
    this.slots.push(lvl7);

    var lvl8: SpellLevel = new SpellLevel();
    lvl8.lvlName = "Lvl 8";
    lvl8.maxSlots = 0;
    lvl8.slots = [];
    this.slots.push(lvl8);

    var lvl9: SpellLevel = new SpellLevel();
    lvl9.lvlName = "Lvl 9";
    lvl9.maxSlots = 0;
    lvl9.slots = [];
    this.slots.push(lvl9);

    this.longRest();
  }

  longRest() {
    if (this.slots !== undefined) {
      this.slots.forEach((s) => {
        s.slots = [];
        for (var i = 0; i < s.maxSlots; ++i) {
          var slot: SpellSlot;
          slot.slotUsed = false;
          s.slots.push(slot);
        }
      });
    }
  }
}
