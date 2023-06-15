export const firstDifferent = (input: string[], excludes: string[]): string => {
  const [first] = input.filter((item) => !excludes.includes(item));
  return first;
};
