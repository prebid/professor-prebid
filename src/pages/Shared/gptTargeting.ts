type SlotTargetingSource = Pick<googletag.Slot, 'getTargetingKeys' | 'getTargeting'> & {
  getConfig?: (key: 'targeting') => { targeting?: Readonly<Record<string, string | readonly string[] | null>> };
};

export const getSlotTargeting = (slot?: SlotTargetingSource): Record<string, string[]> => {
  if (!slot) return {};

  const targeting = typeof slot.getConfig === 'function' ? slot.getConfig('targeting').targeting || {} : Object.fromEntries(slot.getTargetingKeys().map((key) => [key, slot.getTargeting(key)]));

  return Object.fromEntries(Object.entries(targeting).flatMap(([key, value]) => (value == null ? [] : [[key, typeof value === 'string' ? [value] : [...value]]])));
};
