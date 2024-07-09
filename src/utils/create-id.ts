/**
 * Concatenates an `id` and `prtry` values
 *
 * @remarks
 * This function returns a type to be used by entity IDs
 * @param id - `id` value
 * @param prtry - `prtry` value
 * @returns A string joining the two input parameters in order
 *
 */
export function createId(id: string, prtry: string): string {
  return `${id}${prtry}`;
}

/**
 * Concatenates an `id`, `prtry` and `mmbId` values
 *
 * @remarks
 * This function returns a type to be used by account IDs
 * @param id - `id` value
 * @param prtry - `prtry` value
 * @param mmbId - `mmbId` value
 * @returns A string joining the three input parameters in order
 *
 */
export function createAccountId(id: string, prtry: string, mmbId: string): string {
  return `${createId(id, prtry)}${mmbId}`;
}
