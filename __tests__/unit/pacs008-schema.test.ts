// SPDX-License-Identifier: Apache-2.0
import Ajv from 'ajv';
import type { Pacs008 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { Pacs008Sample } from '@tazama-lf/frms-coe-lib/lib/tests/data';
import schema from '../../src/schemas/pacs.008.json';

const createPayload = (rate: number | string | undefined) => {
  // Match an HTTP JSON body: the shared fixture contains Date instances.
  const payload = JSON.parse(JSON.stringify(Pacs008Sample)) as Pacs008;
  Reflect.deleteProperty(payload, 'TenantId');
  Reflect.deleteProperty(payload, 'DataCache');
  return {
    ...payload,
    FIToFICstmrCdtTrf: {
      ...payload.FIToFICstmrCdtTrf,
      CdtTrfTxInf: { ...payload.FIToFICstmrCdtTrf.CdtTrfTxInf, XchgRate: rate },
    },
  };
};

describe('pacs.008 XchgRate schema', () => {
  describe('non-coercing validation', () => {
    const validate = new Ajv({ coerceTypes: false, strict: false }).compile(schema);

    it.each([1, 1.25, 17.536082])('accepts numeric XchgRate %s without mutation', (rate) => {
      const payload = createPayload(rate);
      const original = structuredClone(payload);
      expect(validate(payload)).toBe(true);
      expect(payload).toEqual(original);
      expect(payload.FIToFICstmrCdtTrf.CdtTrfTxInf.XchgRate).toBe(rate);
    });

    it('rejects string XchgRate', () => {
      expect(validate(createPayload('1.25'))).toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ instancePath: '/FIToFICstmrCdtTrf/CdtTrfTxInf/XchgRate', keyword: 'type' })]),
      );
    });
  });

  describe('production AJV options', () => {
    const validate = new Ajv({
      removeAdditional: 'all',
      useDefaults: true,
      coerceTypes: 'array',
      strictTuples: false,
      strict: false,
    }).compile(schema);

    it.each([1, 1.25, 17.536082])('preserves numeric XchgRate %s', (rate) => {
      const payload = createPayload(rate);
      expect(validate(payload)).toBe(true);
      expect(payload.FIToFICstmrCdtTrf.CdtTrfTxInf.XchgRate).toBe(rate);
      expect(typeof payload.FIToFICstmrCdtTrf.CdtTrfTxInf.XchgRate).toBe('number');
    });

    it('normalizes a numeric string to a number', () => {
      const payload = createPayload('1.25');
      expect(validate(payload)).toBe(true);
      expect(payload.FIToFICstmrCdtTrf.CdtTrfTxInf.XchgRate).toBe(1.25);
    });

    it('rejects a nonnumeric string', () => {
      expect(validate(createPayload('invalid'))).toBe(false);
    });

    it('allows omitted XchgRate', () => {
      const payload = createPayload(undefined);
      Reflect.deleteProperty(payload.FIToFICstmrCdtTrf.CdtTrfTxInf, 'XchgRate');
      expect(validate(payload)).toBe(true);
      expect(payload.FIToFICstmrCdtTrf.CdtTrfTxInf).not.toHaveProperty('XchgRate');
    });
  });
});
