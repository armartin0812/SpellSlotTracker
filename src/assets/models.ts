export class SpellLevel {
  lvlName: string;
  maxSlots: number;
  slots: SpellSlot[];
}

export class SpellSlot {
  slotUsed: boolean;
}
