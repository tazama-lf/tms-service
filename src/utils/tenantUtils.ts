// SPDX-License-Identifier: Apache-2.0

/**
 * Multi-tenant key generation utilities
 * Ensures all entity and account keys are prefixed with tenantId for proper isolation
 */

/**
 * Generates a tenant-aware debtor entity key
 * @param tenantId The tenant identifier
 * @param debtorId The debtor's other ID
 * @param schemeProprietary The scheme proprietary value
 * @returns Tenant-prefixed debtor entity key
 */
export const generateDebtorEntityKey = (tenantId: string, debtorId: string, schemeProprietary: string): string =>
  `${tenantId}${debtorId}${schemeProprietary}`;

/**
 * Generates a tenant-aware creditor entity key
 * @param tenantId The tenant identifier
 * @param creditorId The creditor's other ID
 * @param schemeProprietary The scheme proprietary value
 * @returns Tenant-prefixed creditor entity key
 */
export const generateCreditorEntityKey = (tenantId: string, creditorId: string, schemeProprietary: string): string =>
  `${tenantId}${creditorId}${schemeProprietary}`;

/**
 * Generates a tenant-aware debtor account key
 * @param tenantId The tenant identifier
 * @param debtorAcctId The debtor's account other ID
 * @param schemeProprietary The scheme proprietary value
 * @param membershipId The membership ID
 * @returns Tenant-prefixed debtor account key
 */
export const generateDebtorAccountKey = (tenantId: string, debtorAcctId: string, schemeProprietary: string, membershipId: string): string =>
  `${tenantId}${debtorAcctId}${schemeProprietary}${membershipId}`;

/**
 * Generates a tenant-aware creditor account key
 * @param tenantId The tenant identifier
 * @param creditorAcctId The creditor's account other ID
 * @param schemeProprietary The scheme proprietary value
 * @param membershipId The membership ID
 * @returns Tenant-prefixed creditor account key
 */
export const generateCreditorAccountKey = (
  tenantId: string,
  creditorAcctId: string,
  schemeProprietary: string,
  membershipId: string,
): string => `${tenantId}${creditorAcctId}${schemeProprietary}${membershipId}`;

/**
 * Generates a tenant-aware cache key by prefixing the original key with tenantId
 * @param tenantId The tenant identifier
 * @param originalKey The original cache key
 * @returns Tenant-prefixed cache key
 */
export const generateTenantCacheKey = (tenantId: string, originalKey: string): string => `${tenantId}:${originalKey}`;

/**
 * Utility function to extract tenant ID from a tenant-prefixed key
 * @param tenantPrefixedKey The key with tenant prefix
 * @returns The extracted tenant ID
 */
export const extractTenantFromKey = (tenantPrefixedKey: string): string => {
  const INVALID_INDEX = -1;
  const START_INDEX = 0;
  const colonIndex = tenantPrefixedKey.indexOf(':');

  if (colonIndex === INVALID_INDEX) {
    throw new Error('Invalid tenant-prefixed key format');
  }
  return tenantPrefixedKey.substring(START_INDEX, colonIndex);
};
