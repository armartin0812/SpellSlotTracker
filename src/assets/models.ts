export class SpellLevel {
  lvlName: string = '';
  lvlAbrev: string = '';
  spellLevel: number = 0;
  maxSlots: number = 0;
  slots: SpellSlot[] = [];
}

export class SpellSlot {
  spellLevel: number = 0;
  slotAbrev: string = '';
  slotUsed: boolean = false;
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
  characterID: string = '';
  characterName: string = '';
  characterClass: PlayerClass = 0;
  characterLevel: number = 0;
  currentHP: number = 0;
  maxHP: number = 0;
  spells: SpellLevel[] = [];
  slots: SpellLevel[] = [];
}
