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
