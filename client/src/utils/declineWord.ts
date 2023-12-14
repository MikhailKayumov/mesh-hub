export default function declineWord(
  number: number,
  worlds: readonly [string, string, string],
  onlyWorld = false,
): string {
  const module = number % 100;
  if (module > 5 && module < 20) {
    return `${!onlyWorld ? `${number} ` : ''}${worlds[2]}`;
  }

  const declines = [2, 0, 1, 1, 1, 2];

  return `${!onlyWorld ? `${number} ` : ''}${worlds[declines[Math.min(module % 10, 5)]]}`;
}
