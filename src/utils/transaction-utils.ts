// SPDX-License-Identifier: Apache-2.0

// Constants
const LAST_ELEMENT_OFFSET = 1;

/**
 * Extracts the transaction type from a URL path
 * @param url The URL path (e.g., '/v1/evaluate/iso20022/pacs.008.001.10')
 * @returns The transaction type (e.g., 'pacs.008.001.10')
 */
export const extractTransactionType = (url?: string): string => {
  if (!url) {
    return 'unknown';
  }

  // Extract the transaction type from the URL path
  // Expected format: /v1/evaluate/iso20022/[transaction-type]
  const parts = url.split('/');
  const transactionType = parts[parts.length - LAST_ELEMENT_OFFSET]; // Get the last part

  return transactionType || 'unknown';
};
