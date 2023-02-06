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
  characterID: string;
  characterName: string;
  characterClass: PlayerClass;
  characterLevel: number;
  spells: SpellLevel[];
}
