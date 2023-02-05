export class SpellLevel {
  lvlName: string;
  spellLevel: number;
  maxSlots: number;
  slots: SpellSlot[];
}

export class SpellSlot {
  spellLevel: number;
  slotUsed: boolean;
}

export enum PlayerClass {
  Barbarian = 1,
  Bard = 2,
  Cleric = 3,
  Druid = 4,
  Fighter = 5,
  Monk = 6,
  Paladin = 7,
  Ranger = 8,
  Rogue = 9,
  Sorcerer = 10,
  Warlock = 11,
  Wizard = 12
}

export class Character {
  characterName: string;
  characterClass: PlayerClass;
  characterLevel: number;
  spells: SpellLevel[];

  initializeSpellSlots() {
    this.spells = [];
    var lvl1: SpellLevel = new SpellLevel();
    lvl1.lvlName = "Lvl 1";
    lvl1.spellLevel = 1;
    lvl1.maxSlots = 0;
    lvl1.slots = [];
    this.spells.push(Object.assign(lvl1));

    var lvl2: SpellLevel = new SpellLevel();
    lvl2.lvlName = "Lvl 2";
    lvl2.spellLevel = 2;
    lvl2.maxSlots = 0;
    lvl2.slots = [];
    this.spells.push(Object.assign(lvl2));

    var lvl3: SpellLevel = new SpellLevel();
    lvl3.lvlName = "Lvl 3";
    lvl3.spellLevel = 3;
    lvl3.maxSlots = 0;
    lvl3.slots = [];
    this.spells.push(Object.assign(lvl3));

    var lvl4: SpellLevel = new SpellLevel();
    lvl4.lvlName = "Lvl 4";
    lvl4.spellLevel = 4;
    lvl4.maxSlots = 0;
    lvl4.slots = [];
    this.spells.push(Object.assign(lvl4));

    var lvl5: SpellLevel = new SpellLevel();
    lvl5.lvlName = "Lvl 5";
    lvl5.spellLevel = 5;
    lvl5.maxSlots = 0;
    lvl5.slots = [];
    this.spells.push(Object.assign(lvl5));

    var lvl6: SpellLevel = new SpellLevel();
    lvl6.lvlName = "Lvl 6";
    lvl6.spellLevel = 6;
    lvl6.maxSlots = 0;
    lvl6.slots = [];
    this.spells.push(Object.assign(lvl6));

    var lvl7: SpellLevel = new SpellLevel();
    lvl7.lvlName = "Lvl 7";
    lvl7.spellLevel = 7;
    lvl7.maxSlots = 0;
    lvl7.slots = [];
    this.spells.push(Object.assign(lvl7));

    var lvl8: SpellLevel = new SpellLevel();
    lvl8.lvlName = "Lvl 8";
    lvl8.spellLevel = 8;
    lvl8.maxSlots = 0;
    lvl8.slots = [];
    this.spells.push(Object.assign(lvl8));

    var lvl9: SpellLevel = new SpellLevel();
    lvl9.lvlName = "Lvl 9";
    lvl9.spellLevel = 9;
    lvl9.maxSlots = 0;
    lvl9.slots = [];
    this.spells.push(Object.assign(lvl9));
  }

  longRest() {
    if (this.spells !== undefined) {
      this.spells.forEach((s) => {
        s.slots = [];
        for (var i = 0; i < s.maxSlots; ++i) {
          var slot: SpellSlot = new SpellSlot();
          slot.spellLevel = s.spellLevel;
          slot.slotUsed = false;
          var t = Object.assign(slot);
          s.slots.push(t);
        }
      });
    }
  }
}
