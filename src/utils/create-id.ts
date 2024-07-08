export function createId(id: string, prtry: string): string {
  return `${id}${prtry}`;
}

export function createAccountId(id: string, prtry: string, mmbId: string): string {
  return `${createId(id, prtry)}${mmbId}`;
}
