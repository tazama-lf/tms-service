// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { cacheDatabaseManager, dbInit, runServer, server } from '../../src/index';
import * as LogicService from '../../src/logic.service';
import { configuration } from '../../src/';
import { CacheDatabaseClientMocks, DatabaseManagerMocks } from '@tazama-lf/frms-coe-lib/lib/tests/mocks/mock-transactions';
import { Pacs002Sample, Pacs008Sample, Pain001Sample, Pain013Sample } from '@tazama-lf/frms-coe-lib/lib/tests/data';

jest.mock('@tazama-lf/frms-coe-lib/lib/helpers/env', () => ({
  validateProcessorConfig: jest.fn().mockReturnValue({
    functionName: 'test-ed',
    nodeEnv: 'test',
  }),
}));

jest.mock('@tazama-lf/frms-coe-lib/lib/helpers/env/database.config', () => ({
  Database: {
    CONFIGURATION: 'MOCK_DB',
  },
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

      jest
        .spyOn(cacheDatabaseManager, 'saveTransactionHistory')
        .mockImplementation((transaction: any, transactionhistorycollection: string) => {
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

      jest
        .spyOn(cacheDatabaseManager, 'saveTransactionHistory')
        .mockImplementation((transaction: any, transactionhistorycollection: string) => {
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

    it('should handle pacs.008, database error', async () => {
      jest
        .spyOn(cacheDatabaseManager, 'saveTransactionHistory')
        .mockImplementation((transaction: Pain001 | Pain013 | Pacs008 | Pacs002, transactionhistorycollection: string) => {
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
      configuration.QUOTING = false;
      const request = Pacs008Sample as Pacs008;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

      await LogicService.handlePacs008(request, 'pacs.008.001.10');
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
            '[[{"TxTp":"pacs.008.001.10","FIToFICstmrCdtTrf":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":[{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":[{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}]},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}]]',
          ),
        );
      });

      const request = Pacs002Sample as Pacs002;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs002');
      await LogicService.handlePacs002(request, 'pacs.002.001.12');
      expect(handleSpy).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle pacs.002, database error', async () => {
      jest.spyOn(cacheDatabaseManager, 'getTransactionPacs008').mockImplementation((EndToEndId: string) => {
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
});
