// SPDX-License-Identifier: Apache-2.0

/**
 * Calculates the duration in nanoseconds from a start time
 */
export const calculateDuration = (startTime: bigint): number => {
  const endTime = process.hrtime.bigint();
  return Number(endTime - startTime);
};
