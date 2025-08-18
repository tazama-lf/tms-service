// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as protobuf from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { Pacs002Sample, Pacs008Sample, Pain001Sample, Pain013Sample } from '@tazama-lf/frms-coe-lib/lib/tests/data';
import { CacheDatabaseClientMocks, DatabaseManagerMocks } from '@tazama-lf/frms-coe-lib/lib/tests/mocks/mock-transactions';
import { configuration } from '../../src/';
import { cacheDatabaseManager, dbInit, loggerService, runServer, server } from '../../src/index';
import * as LogicService from '../../src/logic.service';
import { rebuildCache, parseDataCache, calculateDuration } from '../../src/logic.service';
import {
  generateDebtorEntityKey,
  generateCreditorEntityKey,
  generateDebtorAccountKey,
  generateCreditorAccountKey,
  generateTenantCacheKey,
  extractTenantFromKey,
} from '../../src/utils/tenantUtils';

// Common test data constants to avoid duplication
const PACS008_TEST_JSON =
  '{"TxTp":"pacs.008.001.10","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"InstgAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"InstdAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"IntrmyAgt1":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1999-05-09","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"60409827ba274853a2ec2475c64566d5","SchmeNm":{"Prtry":"TAZAMA_EID"}}]}},"CtctDtls":{"MobNb":"+27-730975224"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+27-730975224","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"dfsp002"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"Cdtr":{"Nm":"James Ricci Rubin","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1956-01-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"c49a1e8a-a8f8-4819-b1dd-3abf25325a7f","SchmeNm":{"Prtry":"TAZAMA_EID"}}]}},"CtctDtls":{"MobNb":"+27-710694778"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+27-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"typology003"},"xchgRate":17.536082}}';
const PACS008_TEST_JSON_WITH_TENANT = (tenantId: string) =>
  `[[{"TxTp":"pacs.008.001.10","tenantId":"${tenantId}","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"xchgRate":17.536082,"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"InstgAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"InstdAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"IntrmyAgt1":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1999-05-09","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"60409827ba274853a2ec2475c64566d5","SchmeNm":{"Prtry":"TAZAMA_EID"}}]}},"CtctDtls":{"MobNb":"+27-730975224"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+27-730975224","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"dfsp002"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"Cdtr":{"Nm":"James Ricci Rubin","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1956-01-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"c49a1e8a-a8f8-4819-b1dd-3abf25325a7f","SchmeNm":{"Prtry":"TAZAMA_EID"}}]}},"CtctDtls":{"MobNb":"+27-710694778"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+27-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"typology003"},"xchgRate":17.536082}}]]`;
const PACS008_ARRAY_TEST_JSON = `[[${PACS008_TEST_JSON}]]`;

jest.mock('@tazama-lf/frms-coe-lib/lib/config/processor.config', () => ({
  validateProcessorConfig: jest.fn().mockReturnValue({
    functionName: 'test-ed',
    nodeEnv: 'test',
    maxCPU: 1,
  }),
}));

jest.mock('@tazama-lf/frms-coe-lib/lib/services/apm', () => ({
  Apm: jest.fn().mockReturnValue({
    startSpan: jest.fn(),
    getCurrentTraceparent: jest.fn().mockReturnValue(''),
  }),
}));

jest.mock('@tazama-lf/frms-coe-lib/lib/services/dbManager', () => ({
  CreateStorageManager: jest.fn().mockReturnValue({
    db: {
      set: jest.fn(),
      quit: jest.fn(),
      isReadyCheck: jest.fn().mockReturnValue({ nodeEnv: 'test' }),
    },
    config: {
      redisConfig: { distributedCacheTTL: 300 },
    },
  }),
}));

jest.mock('@tazama-lf/frms-coe-startup-lib/lib/interfaces/iStartupConfig', () => ({
  startupConfig: {
    startupType: 'nats',
    consumerStreamName: 'consumer',
    serverUrl: 'server',
    producerStreamName: 'producer',
    functionName: 'producer',
  },
}));

beforeAll(async () => {
  await dbInit();
  await runServer();
});

afterAll(() => {
  cacheDatabaseManager.quit();
});

describe('App Controller & Logic Service', () => {
  beforeEach(() => {
    CacheDatabaseClientMocks(cacheDatabaseManager);
    DatabaseManagerMocks(cacheDatabaseManager);

    jest.spyOn(server, 'handleResponse').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleExecute', () => {
    it('should handle pain.001', async () => {
      const request = Pain001Sample as Pain001;

      const handleSpy = jest.spyOn(LogicService, 'handlePain001');

      await LogicService.handlePain001(request, 'pain.001.001.11');
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle pain.001, database error', async () => {
      const request = Pain001Sample as Pain001;

      jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
        return new Promise((resolve, reject) => {
          throw new Error('Deliberate Error');
        });
      });

      let error = '';
      try {
        await LogicService.handlePain001(request, 'pain.001.001.11');
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('Deliberate Error');
    });
  });

  it('should handle pain.001, database error that not of type Error', async () => {
    const request = Pain001Sample as Pain001;

    jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
      return new Promise((resolve, reject) => {
        throw { error: 'Deliberate Error' };
      });
    });

    let error = '';
    try {
      await LogicService.handlePain001(request, 'pain.001.001.11');
    } catch (err: any) {
      error = err?.message;
    }
    expect(error).toEqual(JSON.stringify({ error: 'Deliberate Error' }));
  });

  describe('handlePain.013', () => {
    it('should handle pain.013', async () => {
      const request = Pain013Sample as Pain013;

      const handleSpy = jest.spyOn(LogicService, 'handlePain013');

      await LogicService.handlePain013(request, 'pain.013.001.09');
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle pain.013, database error', async () => {
      const request = Pain013Sample as Pain013;

      jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
        return new Promise((resolve, reject) => {
          throw new Error('Deliberate Error');
        });
      });

      let error = '';
      try {
        await LogicService.handlePain013(request, 'pain.013.001.09');
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('Deliberate Error');
    });
  });

  describe('handlePacs.008', () => {
    it('should pacs.008', async () => {
      const request = Pacs008Sample as Pacs008;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

      await LogicService.handlePacs008(request, 'pacs.008.001.10');
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should pacs.008, createMessageBuffer undefined', async () => {
      const request = Pacs008Sample as Pacs008;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

      jest.spyOn(protobuf, 'createMessageBuffer').mockImplementationOnce(() => undefined);

      try {
        await LogicService.handlePacs008(request, 'pacs.008.001.10');

        expect(true).toStrictEqual(false); //unreachable
      } catch (err) {
        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(err).toStrictEqual(new Error('[pacs008] data cache could not be serialized'));
      }
    });

    it('should handle pacs.008, database error', async () => {
      jest
        .spyOn(cacheDatabaseManager, 'saveTransactionHistory')
        .mockImplementation((transaction: Pain001 | Pain013 | Pacs008 | Pacs002) => {
          return new Promise((resolve, reject) => {
            throw new Error('Deliberate Error');
          });
        });
      const request = Pacs008Sample as Pacs008;

      let error = '';
      try {
        await LogicService.handlePacs008(request, 'pacs.008.001.10');
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('Deliberate Error');
    });
  });

  describe('handlePacs.008, quoting enabled', () => {
    it('should handle pacs.008', async () => {
      configuration.QUOTING = true;
      const request = Pacs008Sample as Pacs008;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

      await LogicService.handlePacs008(request, 'pacs.008.001.10');
      expect(configuration.QUOTING).toStrictEqual(true);
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
      configuration.QUOTING = false;
    });
  });

  describe('handlePacs.002', () => {
    it('should handle pacs.002', async () => {
      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementation((EndToEndId: string) => {
        return Promise.resolve(
          JSON.parse(
            '[[{"TxTp":"pacs.008.001.10","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"xchgRate":17.536082,"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}]]',
          ),
        );
      });

      jest.spyOn(cacheDatabaseManager, 'getBuffer').mockImplementationOnce(() => {
        return Promise.resolve({
          DataCache: {
            dbtrId: '1234',
            cdtrId: '5678',
            dbtrAcctId: '4321',
            cdtrAcctId: '8765',
          },
        });
      });

      const request = Pacs002Sample as Pacs002;

      const rebuildCacheSpy = jest.spyOn(LogicService, 'rebuildCache');
      const handleSpy = jest.spyOn(LogicService, 'handlePacs002');

      await LogicService.handlePacs002(request, 'pacs.002.001.12');

      expect(rebuildCacheSpy).toHaveBeenCalledTimes(0);
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle pacs.002 - rebuildCache', async () => {
      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementation((EndToEndId: string) => {
        return Promise.resolve(
          JSON.parse(
            '[[{"TxTp":"pacs.008.001.10","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"xchgRate":17.536082,"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}]]',
          ),
        );
      });

      const request = Pacs002Sample as Pacs002;

      const rebuildCacheSpy = jest.spyOn(LogicService, 'rebuildCache');

      jest.spyOn(cacheDatabaseManager, 'getBuffer').mockImplementationOnce(() => {
        return Promise.resolve({}); // expected behaviour for bad key
      });

      const handleSpy = jest.spyOn(LogicService, 'handlePacs002');

      await LogicService.handlePacs002(request, 'pacs.002.001.12');
      expect(rebuildCacheSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle pacs.002, database error', async () => {
      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementationOnce((EndToEndId: string) => {
        return new Promise((resolve, reject) => {
          throw new Error('Deliberate Error');
        });
      });
      const request = Pacs002Sample as Pacs002;

      let error = '';
      try {
        await LogicService.handlePacs002(request, 'pacs.002.001.12');
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('Deliberate Error');
    });

    it('should handle pacs.002, database unable to save', async () => {
      jest.spyOn(cacheDatabaseManager, 'getBuffer').mockImplementationOnce(() => {
        return Promise.resolve({
          DataCache: {
            dbtrId: '1234',
            cdtrId: '5678',
            dbtrAcctId: '4321',
            cdtrAcctId: '8765',
          },
        });
      });
      jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockRejectedValueOnce(new Error('Deliberate Error'));

      const request = Pacs002Sample as Pacs002;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs002');
      try {
        await LogicService.handlePacs002(request, 'pacs.002.001.12');

        expect(true).toBe(false); // unreachable
      } catch (err) {
        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(err).toEqual(new Error('Deliberate Error'));
      }
    });
  });

  describe('Error cases', () => {
    it('should fail gracefully - rebuildCache', async () => {
      const request = Pacs002Sample as Pacs002;

      jest.spyOn(cacheDatabaseManager, 'getBuffer').mockRejectedValue((key: any) => {
        return Promise.resolve('some error');
      });

      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementation((key: any) => {
        return Promise.resolve('');
      });

      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementation((key: any) => {
        return Promise.resolve([
          [
            JSON.parse(
              '{"TxTp":"pacs.008.001.10","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}',
            ),
          ],
        ]);
      });

      const handleSpy = jest.spyOn(LogicService, 'handlePacs002');

      await LogicService.handlePacs002(request, 'pacs.002.001.12');
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();

      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementation((key: any) => {
        return Promise.resolve([[Pacs008Sample]]);
      });
      await LogicService.handlePacs002(request, 'pacs.002.001.12');
      expect(handleSpy).toHaveBeenCalledTimes(2);
      expect(handleSpy).toHaveReturned();
    });

    it('should fail gracefully - rebuildCache', async () => {
      const request = Pacs002Sample as Pacs002;

      jest.spyOn(cacheDatabaseManager, 'getBuffer').mockRejectedValue((key: any) => {
        return Promise.resolve('some error');
      });

      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementationOnce((key: any) => {
        return Promise.resolve([[]]);
      });

      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementation((key: any) => {
        return Promise.resolve([
          [
            JSON.parse(
              '{"TxTp":"pacs.008.001.10","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}',
            ),
          ],
        ]);
      });

      const handleSpy = jest.spyOn(LogicService, 'handlePacs002');

      await LogicService.handlePacs002(request, 'pacs.002.001.12');

      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });
  });

  describe('rebuildCache', () => {
    it('no pacs008', async () => {
      const EndToEndId = crypto.randomUUID();
      const Id = crypto.randomUUID();

      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementationOnce((key: any) => {
        return Promise.resolve([[]]);
      });

      const rebuildCacheSpy = jest.spyOn(LogicService, 'rebuildCache');
      const loggerErrorSpy = jest.spyOn(loggerService, 'error');

      await LogicService.rebuildCache(EndToEndId, true, 'DEFAULT', Id);
      expect(rebuildCacheSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith('Could not find pacs008 transaction to rebuild dataCache with', 'rebuildCache()', Id);
    });

    it('writeToRedis', async () => {
      const EndToEndId = crypto.randomUUID();
      const Id = crypto.randomUUID();

      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementationOnce((key: any) => {
        return Promise.resolve([
          [
            JSON.parse(
              '{"TxTp":"pacs.008.001.10","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}',
            ),
          ],
        ]);
      });

      const rebuildCacheSpy = jest.spyOn(LogicService, 'rebuildCache');

      await LogicService.rebuildCache(EndToEndId, true, 'DEFAULT', Id);
      expect(rebuildCacheSpy).toHaveBeenCalledTimes(1);
    });

    it('writeToRedis - createMessageBuffer error', async () => {
      const EndToEndId = crypto.randomUUID();
      const Id = crypto.randomUUID();

      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementationOnce((key: any) => {
        return Promise.resolve([
          [
            JSON.parse(
              '{"TxTp":"pacs.008.001.10","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}',
            ),
          ],
        ]);
      });

      jest.spyOn(protobuf, 'createMessageBuffer').mockImplementationOnce(() => undefined);

      const rebuildCacheSpy = jest.spyOn(LogicService, 'rebuildCache');
      const loggerErrorSpy = jest.spyOn(loggerService, 'error');

      await LogicService.rebuildCache(EndToEndId, true, 'DEFAULT', Id);
      expect(rebuildCacheSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith('[pacs008] could not rebuild redis cache');
    });
  });

  // ============== TENANT-AWARE TESTS ==============
  describe('Multi-Tenancy Tests', () => {
    describe('Tenant Validation Middleware', () => {
      const { validateAndExtractTenantMiddleware } = require('../../src/middleware/tenantMiddleware');

      it('should set tenantId from header when AUTHENTICATED=false', async () => {
        const originalAuthenticated = configuration.AUTHENTICATED;
        configuration.AUTHENTICATED = false;

        const mockRequest: any = {
          body: { CstmrCdtTrfInitn: Pain001Sample.CstmrCdtTrfInitn },
          headers: { tenantId: 'test-tenant' },
        };
        const mockReply: any = {
          code: jest.fn().mockReturnThis(),
          send: jest.fn(),
        };

        await validateAndExtractTenantMiddleware(mockRequest, mockReply);

        expect(mockRequest.tenantId).toBe('test-tenant');
        configuration.AUTHENTICATED = originalAuthenticated;
      });

      it('should set tenantId to DEFAULT when AUTHENTICATED=false', async () => {
        const originalAuthenticated = configuration.AUTHENTICATED;
        configuration.AUTHENTICATED = false;

        const mockRequest: any = {
          body: { CstmrCdtTrfInitn: Pain001Sample.CstmrCdtTrfInitn },
          headers: {},
        };
        const mockReply: any = {
          code: jest.fn().mockReturnThis(),
          send: jest.fn(),
        };

        await validateAndExtractTenantMiddleware(mockRequest, mockReply);

        expect(mockRequest.tenantId).toEqual('DEFAULT');
        expect(mockReply.code).not.toHaveBeenCalled();
        expect(mockReply.send).not.toHaveBeenCalled();

        configuration.AUTHENTICATED = originalAuthenticated;
      });

      it('should extract TENANT_ID from JWT when AUTHENTICATED=true', async () => {
        const originalAuthenticated = configuration.AUTHENTICATED;
        configuration.AUTHENTICATED = true;

        const payload = { TENANT_ID: 'valid-tenant-123' };
        const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

        const mockRequest: any = {
          body: { CstmrCdtTrfInitn: Pain001Sample.CstmrCdtTrfInitn },
          headers: { authorization: `Bearer ${token}` },
        };
        const mockReply: any = {
          code: jest.fn().mockReturnThis(),
          send: jest.fn(),
        };

        await validateAndExtractTenantMiddleware(mockRequest, mockReply);

        expect(mockRequest.tenantId).toEqual('valid-tenant-123');
        expect(mockReply.code).not.toHaveBeenCalled();
        expect(mockReply.send).not.toHaveBeenCalled();

        configuration.AUTHENTICATED = originalAuthenticated;
      });

      it('should return 403 when TENANT_ID is blank in JWT', async () => {
        const originalAuthenticated = configuration.AUTHENTICATED;
        configuration.AUTHENTICATED = true;

        const payload = { TENANT_ID: '' };
        const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

        const mockRequest: any = {
          body: { CstmrCdtTrfInitn: Pain001Sample.CstmrCdtTrfInitn },
          headers: { authorization: `Bearer ${token}` },
        };
        const mockReply: any = {
          code: jest.fn().mockReturnThis(),
          send: jest.fn(),
        };

        await validateAndExtractTenantMiddleware(mockRequest, mockReply);

        expect(mockReply.code).toHaveBeenCalledWith(403);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Forbidden',
          message: 'TENANT_ID or tenantId attribute is required and cannot be blank',
        });

        configuration.AUTHENTICATED = originalAuthenticated;
      });

      it('should return 401 when authorization header is missing and AUTHENTICATED=true', async () => {
        const originalAuthenticated = configuration.AUTHENTICATED;
        configuration.AUTHENTICATED = true;

        const mockRequest: any = {
          body: { CstmrCdtTrfInitn: Pain001Sample.CstmrCdtTrfInitn },
          headers: {},
        };
        const mockReply: any = {
          code: jest.fn().mockReturnThis(),
          send: jest.fn(),
        };

        await validateAndExtractTenantMiddleware(mockRequest, mockReply);

        expect(mockReply.code).toHaveBeenCalledWith(401);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Missing or invalid authorization header',
        });

        configuration.AUTHENTICATED = originalAuthenticated;
      });

      it('should return 401 when JWT token is invalid', async () => {
        const originalAuthenticated = configuration.AUTHENTICATED;
        configuration.AUTHENTICATED = true;

        const mockRequest: any = {
          body: { CstmrCdtTrfInitn: Pain001Sample.CstmrCdtTrfInitn },
          headers: { authorization: 'Bearer invalid.jwt.token' },
        };
        const mockReply: any = {
          code: jest.fn().mockReturnThis(),
          send: jest.fn(),
        };

        await validateAndExtractTenantMiddleware(mockRequest, mockReply);

        expect(mockReply.code).toHaveBeenCalledWith(401);
        expect(mockReply.send).toHaveBeenCalledWith({
          error: 'Invalid JWT token',
        });

        configuration.AUTHENTICATED = originalAuthenticated;
      });
    });

    describe('Tenant Key Generation Utilities', () => {
      it('should generate tenant-aware debtor entity keys', () => {
        const tenantId = 'tenant123';
        const entityId = 'DEBTOR001';
        const scheme = 'MSISDN';

        const key = generateDebtorEntityKey(tenantId, entityId, scheme);
        expect(key).toEqual('tenant123DEBTOR001MSISDN');
      });

      it('should generate tenant-aware creditor entity keys', () => {
        const tenantId = 'tenant456';
        const entityId = 'CREDITOR001';
        const scheme = 'IBAN';

        const key = generateCreditorEntityKey(tenantId, entityId, scheme);
        expect(key).toEqual('tenant456CREDITOR001IBAN');
      });

      it('should generate tenant-aware debtor account keys', () => {
        const tenantId = 'tenant789';
        const accountId = 'ACC001';
        const scheme = 'MSISDN';
        const memberId = 'BANK001';

        const key = generateDebtorAccountKey(tenantId, accountId, scheme, memberId);
        expect(key).toEqual('tenant789ACC001MSISDNBANK001');
      });

      it('should generate tenant-aware creditor account keys', () => {
        const tenantId = 'tenant999';
        const accountId = 'ACC002';
        const scheme = 'IBAN';
        const memberId = 'BANK002';

        const key = generateCreditorAccountKey(tenantId, accountId, scheme, memberId);
        expect(key).toEqual('tenant999ACC002IBANBANK002');
      });
    });

    describe('Additional Utility Functions', () => {
      it('should generate tenant-aware cache keys', () => {
        const tenantId = 'tenant123';
        const originalKey = 'original-cache-key';

        const key = generateTenantCacheKey(tenantId, originalKey);
        expect(key).toEqual('tenant123:original-cache-key');
      });

      it('should extract tenant ID from tenant-prefixed key', () => {
        const tenantPrefixedKey = 'tenant456:some-key-value';

        const tenantId = extractTenantFromKey(tenantPrefixedKey);
        expect(tenantId).toEqual('tenant456');
      });

      it('should throw error for invalid tenant-prefixed key format', () => {
        const invalidKey = 'invalid-key-without-colon';

        expect(() => extractTenantFromKey(invalidKey)).toThrow('Invalid tenant-prefixed key format');
      });

      it('should parse data cache with default tenant', () => {
        const transaction = Pacs008Sample as Pacs008;

        const result = parseDataCache(transaction);
        expect(result).toHaveProperty('cdtrId');
        expect(result).toHaveProperty('dbtrId');
        expect(result).toHaveProperty('cdtrAcctId');
        expect(result).toHaveProperty('dbtrAcctId');
        expect(result.cdtrId).toContain('DEFAULT');
      });

      it('should parse data cache with specified tenant', () => {
        const transaction = Pacs008Sample as Pacs008;
        const tenantId = 'specific-tenant';

        const result = parseDataCache(transaction, tenantId);
        expect(result).toHaveProperty('cdtrId');
        expect(result).toHaveProperty('dbtrId');
        expect(result).toHaveProperty('cdtrAcctId');
        expect(result).toHaveProperty('dbtrAcctId');
        expect(result.cdtrId).toContain('specific-tenant');
      });

      it('should parse data cache tenant-aware', () => {
        const transaction = Pacs008Sample as Pacs008;
        const tenantId = 'tenant-aware-test';

        const result = parseDataCache(transaction, tenantId);
        expect(result).toHaveProperty('cdtrId');
        expect(result).toHaveProperty('dbtrId');
        expect(result).toHaveProperty('cdtrAcctId');
        expect(result).toHaveProperty('dbtrAcctId');
        expect(result.cdtrId).toContain('tenant-aware-test');
        expect(result.dbtrId).toContain('tenant-aware-test');
      });

      it('should calculate duration', () => {
        const startTime = process.hrtime.bigint();

        // Wait a small amount
        const endTime = process.hrtime.bigint();
        const duration = calculateDuration(startTime);

        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Tenant-Aware Pain001 Handler', () => {
      it('should handle tenant-aware pain.001', async () => {
        const request = { ...Pain001Sample, TenantId: 'tenant123' } as Pain001 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePain001');
        const loggerSpy = jest.spyOn(loggerService, 'log');

        await LogicService.handlePain001(request, 'pain.001.001.11');

        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('tenant tenant123'), 'handlePain001()', expect.any(String));
      });

      it('should handle non-tenant pain.001 for backward compatibility', async () => {
        const request = { ...Pain001Sample, TenantId: 'DEFAULT' } as Pain001 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePain001');
        const loggerSpy = jest.spyOn(loggerService, 'log');

        await LogicService.handlePain001(request, 'pain.001.001.11');

        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(loggerSpy).toHaveBeenCalledWith('Start - Handle transaction data for tenant DEFAULT', 'handlePain001()', expect.any(String));
      });

      it('should handle tenant-aware pain.001, database error', async () => {
        const request = { ...Pain001Sample, TenantId: 'tenant123' } as Pain001 & { TenantId: string };

        jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
          return new Promise((resolve, reject) => {
            throw new Error('Tenant Deliberate Error');
          });
        });

        let error = '';
        try {
          await LogicService.handlePain001(request, 'pain.001.001.11');
        } catch (err: any) {
          error = err?.message;
        }
        expect(error).toEqual('Tenant Deliberate Error');
      });
    });

    describe('Tenant-Aware Pain013 Handler', () => {
      it('should handle tenant-aware pain.013', async () => {
        const request = { ...Pain013Sample, TenantId: 'tenant456' } as Pain013 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePain013');
        const loggerSpy = jest.spyOn(loggerService, 'log');

        await LogicService.handlePain013(request, 'pain.013.001.09');

        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('tenant tenant456'), 'handlePain013()', expect.any(String));
      });

      it('should handle non-tenant pain.013 for backward compatibility', async () => {
        const request = { ...Pain013Sample, TenantId: 'DEFAULT' } as Pain013 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePain013');
        const loggerSpy = jest.spyOn(loggerService, 'log');

        await LogicService.handlePain013(request, 'pain.013.001.09');

        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(loggerSpy).toHaveBeenCalledWith('Start - Handle transaction data for tenant DEFAULT', 'handlePain013()', expect.any(String));
      });

      it('should handle tenant-aware pain.013, database error', async () => {
        const request = { ...Pain013Sample, TenantId: 'tenant456' } as Pain013 & { TenantId: string };

        jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
          return new Promise((resolve, reject) => {
            throw new Error('Tenant Pain013 Error');
          });
        });

        let error = '';
        try {
          await LogicService.handlePain013(request, 'pain.013.001.09');
        } catch (err: any) {
          error = err?.message;
        }
        expect(error).toEqual('Tenant Pain013 Error');
      });
    });

    describe('Tenant-Aware Pacs008 Handler', () => {
      it('should handle tenant-aware pacs.008', async () => {
        const request = { ...Pacs008Sample, TenantId: 'tenant789' } as Pacs008 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePacs008');
        const loggerSpy = jest.spyOn(loggerService, 'log');

        await LogicService.handlePacs008(request, 'pacs.008.001.10');

        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('tenant tenant789'), 'handlePacs008()', expect.any(String));
      });

      it('should handle non-tenant pacs.008 for backward compatibility', async () => {
        const request = { ...Pacs008Sample, TenantId: 'DEFAULT' } as Pacs008 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePacs008');
        const loggerSpy = jest.spyOn(loggerService, 'log');

        await LogicService.handlePacs008(request, 'pacs.008.001.10');

        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(loggerSpy).toHaveBeenCalledWith('Start - Handle transaction data for tenant DEFAULT', 'handlePacs008()', expect.any(String));
      });

      it('should handle tenant-aware pacs.008 with quoting enabled', async () => {
        configuration.QUOTING = true;
        const request = { ...Pacs008Sample, TenantId: 'tenant789' } as Pacs008 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

        await LogicService.handlePacs008(request, 'pacs.008.001.10');

        expect(configuration.QUOTING).toStrictEqual(true);
        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        configuration.QUOTING = false;
      });

      it('should handle tenant-aware pacs.008, createMessageBuffer undefined', async () => {
        const request = { ...Pacs008Sample, TenantId: 'tenant789' } as Pacs008 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePacs008');
        jest.spyOn(protobuf, 'createMessageBuffer').mockImplementationOnce(() => undefined);

        try {
          await LogicService.handlePacs008(request, 'pacs.008.001.10');
          expect(true).toStrictEqual(false); // unreachable
        } catch (err) {
          expect(handleSpy).toHaveBeenCalledTimes(1);
          expect(handleSpy).toHaveReturned();
          expect(err).toStrictEqual(new Error('[pacs008] data cache could not be serialized'));
        }
      });

      it('should handle tenant-aware pacs.008, database error', async () => {
        const request = { ...Pacs008Sample, TenantId: 'tenant789' } as Pacs008 & { TenantId: string };

        jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
          return new Promise((resolve, reject) => {
            throw new Error('Tenant Pacs008 Error');
          });
        });

        let error = '';
        try {
          await LogicService.handlePacs008(request, 'pacs.008.001.10');
        } catch (err: any) {
          error = err?.message;
        }
        expect(error).toEqual('Tenant Pacs008 Error');
      });
    });

    describe('Tenant-Aware Pacs002 Handler', () => {
      it('should handle tenant-aware pacs.002', async () => {
        jest.spyOn(cacheDatabaseManager, 'getBuffer').mockImplementationOnce(() => {
          return Promise.resolve({
            DataCache: {
              dbtrId: 'tenant999+07-197368463MSISDN',
              cdtrId: 'tenant999+01-710694778MSISDN',
              dbtrAcctId: 'tenant999+07-197368463MSISDNdfsp002',
              cdtrAcctId: 'tenant999+01-710694778MSISDNtypology003',
            },
          });
        });

        const request = { ...Pacs002Sample, TenantId: 'tenant999' } as Pacs002 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePacs002');
        const loggerSpy = jest.spyOn(loggerService, 'log');

        await LogicService.handlePacs002(request, 'pacs.002.001.12');

        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('tenant tenant999'), 'handlePacs002()', expect.any(String));
      });

      it('should handle non-tenant pacs.002 for backward compatibility', async () => {
        jest.spyOn(cacheDatabaseManager, 'getBuffer').mockImplementationOnce(() => {
          return Promise.resolve({
            DataCache: {
              dbtrId: 'DEFAULTDEBTOR001MSISDN',
              cdtrId: 'DEFAULTCREDITOR001MSISDN',
              dbtrAcctId: 'DEFAULTDEBTOR001MSISDNBANK001',
              cdtrAcctId: 'DEFAULTCREDITOR001MSISDNBANK002',
            },
          });
        });

        const request = { ...Pacs002Sample, TenantId: 'DEFAULT' } as Pacs002 & { TenantId: string };

        const handleSpy = jest.spyOn(LogicService, 'handlePacs002');
        const loggerSpy = jest.spyOn(loggerService, 'log');

        await LogicService.handlePacs002(request, 'pacs.002.001.12');

        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
        expect(loggerSpy).toHaveBeenCalledWith('Start - Handle transaction data for tenant DEFAULT', 'handlePacs002()', expect.any(String));
      });

      it('should handle tenant-aware pacs.002 - rebuildCache fallback', async () => {
        jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementation((EndToEndId: string) => {
          return Promise.resolve(
            JSON.parse(
              '[[{"TxTp":"pacs.008.001.10","tenantId":"tenant999","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"xchgRate":17.536082,"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}]]',
            ),
          );
        });

        jest.spyOn(cacheDatabaseManager, 'getBuffer').mockImplementationOnce(() => {
          return Promise.reject(new Error('Cache miss'));
        });

        const request = { ...Pacs002Sample, TenantId: 'tenant999' } as Pacs002 & { TenantId: string };

        const rebuildCacheSpy = jest.spyOn(LogicService, 'rebuildCache');
        const handleSpy = jest.spyOn(LogicService, 'handlePacs002');

        await LogicService.handlePacs002(request, 'pacs.002.001.12');

        expect(rebuildCacheSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveBeenCalledTimes(1);
        expect(handleSpy).toHaveReturned();
      });

      it('should handle tenant-aware pacs.002, database error', async () => {
        jest.spyOn(cacheDatabaseManager, 'getBuffer').mockImplementationOnce(() => {
          return Promise.resolve({
            DataCache: {
              dbtrId: 'tenant999+07-197368463MSISDN',
              cdtrId: 'tenant999+01-710694778MSISDN',
              dbtrAcctId: 'tenant999+07-197368463MSISDNdfsp002',
              cdtrAcctId: 'tenant999+01-710694778MSISDNtypology003',
            },
          });
        });

        jest.spyOn(cacheDatabaseManager, 'saveTransactionHistory').mockImplementation((transaction: any) => {
          return new Promise((resolve, reject) => {
            throw new Error('Tenant Pacs002 Error');
          });
        });

        const request = { ...Pacs002Sample, TenantId: 'tenant999' } as Pacs002 & { TenantId: string };

        let error = '';
        try {
          await LogicService.handlePacs002(request, 'pacs.002.001.12');
        } catch (err: any) {
          error = err?.message;
        }
        expect(error).toEqual('Tenant Pacs002 Error');
      });
    });

    describe('Transaction Relationship Tenant Integration', () => {
      it('should include TenantId in TransactionRelationship for pain.001', async () => {
        const request = { ...Pain001Sample, TenantId: 'tenant_rel_001' } as Pain001 & { TenantId: string };

        jest.spyOn(cacheDatabaseManager, 'saveTransactionRelationship').mockImplementation((relationship: any) => {
          expect(relationship.TenantId).toEqual('tenant_rel_001');
          return Promise.resolve();
        });

        await LogicService.handlePain001(request, 'pain.001.001.11');
      });

      it('should include TenantId in TransactionRelationship for pain.013', async () => {
        const request = { ...Pain013Sample, TenantId: 'tenant_rel_013' } as Pain013 & { TenantId: string };

        jest.spyOn(cacheDatabaseManager, 'saveTransactionRelationship').mockImplementation((relationship: any) => {
          expect(relationship.TenantId).toEqual('tenant_rel_013');
          return Promise.resolve();
        });

        await LogicService.handlePain013(request, 'pain.013.001.09');
      });

      it('should include TenantId in TransactionRelationship for pacs.008', async () => {
        const request = { ...Pacs008Sample, TenantId: 'tenant_rel_008' } as Pacs008 & { TenantId: string };

        jest.spyOn(cacheDatabaseManager, 'saveTransactionRelationship').mockImplementation((relationship: any) => {
          expect(relationship.TenantId).toEqual('tenant_rel_008');
          return Promise.resolve();
        });

        await LogicService.handlePacs008(request, 'pacs.008.001.10');
      });

      it('should include TenantId in TransactionRelationship for pacs.002', async () => {
        jest.spyOn(cacheDatabaseManager, 'getBuffer').mockImplementationOnce(() => {
          return Promise.resolve({
            DataCache: {
              dbtrId: 'tenant_rel_002+07-197368463MSISDN',
              cdtrId: 'tenant_rel_002+01-710694778MSISDN',
              dbtrAcctId: 'tenant_rel_002+07-197368463MSISDNdfsp002',
              cdtrAcctId: 'tenant_rel_002+01-710694778MSISDNtypology003',
            },
          });
        });

        const request = { ...Pacs002Sample, TenantId: 'tenant_rel_002' } as Pacs002 & { TenantId: string };

        jest.spyOn(cacheDatabaseManager, 'saveTransactionRelationship').mockImplementation((relationship: any) => {
          expect(relationship.TenantId).toEqual('tenant_rel_002');
          return Promise.resolve();
        });

        await LogicService.handlePacs002(request, 'pacs.002.001.12');
      });

      it('should include TenantId=DEFAULT in TransactionRelationship for non-tenant transactions', async () => {
        const request = { ...Pain001Sample, TenantId: 'DEFAULT' } as Pain001 & { TenantId: string };

        jest.spyOn(cacheDatabaseManager, 'saveTransactionRelationship').mockImplementation((relationship: any) => {
          expect(relationship.TenantId).toEqual('DEFAULT');
          return Promise.resolve();
        });

        await LogicService.handlePain001(request, 'pain.001.001.11');
      });
    });
  });
});

