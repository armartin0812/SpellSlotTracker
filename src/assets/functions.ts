import { Character, SpellLevel, SpellSlot } from "./models";

export function initializeSpellSlots(character: Character) {
  character.spells = [];
  var lvl1: SpellLevel = new SpellLevel();
  lvl1.lvlName = "Lvl 1";
  lvl1.lvlAbrev = '1';
  lvl1.spellLevel = 1;
  lvl1.maxSlots = 0;
  lvl1.slots = [];
  character.spells.push(Object.assign(lvl1));

  var lvl2: SpellLevel = new SpellLevel();
  lvl2.lvlName = "Lvl 2";
  lvl2.lvlAbrev = '2';
  lvl2.spellLevel = 2;
  lvl2.maxSlots = 0;
  lvl2.slots = [];
  character.spells.push(Object.assign(lvl2));

  var lvl3: SpellLevel = new SpellLevel();
  lvl3.lvlName = "Lvl 3";
  lvl3.lvlAbrev = '3';
  lvl3.spellLevel = 3;
  lvl3.maxSlots = 0;
  lvl3.slots = [];
  character.spells.push(Object.assign(lvl3));

  var lvl4: SpellLevel = new SpellLevel();
  lvl4.lvlName = "Lvl 4";
  lvl4.lvlAbrev = '4';
  lvl4.spellLevel = 4;
  lvl4.maxSlots = 0;
  lvl4.slots = [];
  character.spells.push(Object.assign(lvl4));

  var lvl5: SpellLevel = new SpellLevel();
  lvl5.lvlName = "Lvl 5";
  lvl5.lvlAbrev = '5';
  lvl5.spellLevel = 5;
  lvl5.maxSlots = 0;
  lvl5.slots = [];
  character.spells.push(Object.assign(lvl5));

  var lvl6: SpellLevel = new SpellLevel();
  lvl6.lvlName = "Lvl 6";
  lvl6.lvlAbrev = '6';
  lvl6.spellLevel = 6;
  lvl6.maxSlots = 0;
  lvl6.slots = [];
  character.spells.push(Object.assign(lvl6));

  var lvl7: SpellLevel = new SpellLevel();
  lvl7.lvlName = "Lvl 7";
  lvl7.lvlAbrev = '7';
  lvl7.spellLevel = 7;
  lvl7.maxSlots = 0;
  lvl7.slots = [];
  character.spells.push(Object.assign(lvl7));

  var lvl8: SpellLevel = new SpellLevel();
  lvl8.lvlName = "Lvl 8";
  lvl8.lvlAbrev = '8';
  lvl8.spellLevel = 8;
  lvl8.maxSlots = 0;
  lvl8.slots = [];
  character.spells.push(Object.assign(lvl8));

  var lvl9: SpellLevel = new SpellLevel();
  lvl9.lvlName = "Lvl 9";
  lvl9.lvlAbrev = '9';
  lvl9.spellLevel = 9;
  lvl9.maxSlots = 0;
  lvl9.slots = [];
  character.spells.push(Object.assign(lvl9));
}

export function longRest(character: Character) {
  if (character.spells !== undefined) {
    character.spells.forEach((s) => {
      s.slots = [];
      for (var i = 0; i < s.maxSlots; ++i) {
        var slot: SpellSlot = new SpellSlot();
        slot.spellLevel = s.spellLevel;
        slot.slotAbrev = s.lvlAbrev;
        slot.slotUsed = false;
        var t = Object.assign(slot);
        s.slots.push(t);
      }
    });
  }
  character.currentHP = character.maxHP;
  character.concentrating = false;
}
