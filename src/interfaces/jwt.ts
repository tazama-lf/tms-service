// SPDX-License-Identifier: Apache-2.0

/**
 * JWT payload interface for authentication tokens
 */
export interface JWTPayload {
  TENANT_ID?: string;
  tenantId?: string;
}
