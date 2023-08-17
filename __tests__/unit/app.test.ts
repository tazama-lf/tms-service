/* eslint-disable @typescript-eslint/no-explicit-any */
import apm from 'elastic-apm-node';
import { Pacs002, Pacs008, Pain001, Pain013 } from '@frmscoe/frms-coe-lib/lib/interfaces';
import { cacheDatabaseClient, databaseManager, runServer, server } from '../../src/index';
import { TransactionRelationship } from '../../src/interfaces/iTransactionRelationship';
import * as LogicService from '../../src/logic.service';
import { configuration } from '../../src/config';

jest.mock('elastic-apm-node');
const mockApm = apm as jest.Mocked<typeof apm>;

interface MockedSpan extends Omit<apm.Span, 'end'> {
  end: jest.Mock;
}

(mockApm.startSpan as jest.MockedFunction<typeof mockApm.startSpan>).mockReturnValue({
  end: jest.fn(),
} as MockedSpan);

beforeAll(async () => {
  await runServer();
});

afterAll(() => {
  cacheDatabaseClient.quit();
  databaseManager.quit();
});

describe('App Controller & Logic Service', () => {
  const getMockRequestPain001 = () =>
    JSON.parse(
      '{"TxTp":"pain.001.001.11","DataCache": {"cdtrId": "+42-966969344","dbtrId": "+36-432226947","cdtrAcctId": "+42-966969344","dbtrAcctId": "+36-432226947"},"CstmrCdtTrfInitn":{"GrpHdr":{"MsgId":"17fa-afea-48d6-b147-05c8463ea494","CreDtTm":"2023-02-03T07:03:17.438Z","NbOfTxs":1,"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+36-432226947","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+36-432226947"}}},"PmtInf":{"PmtInfId":"23730c89dd57490a9a79f9b3747e3c08","PmtMtd":"TRA","ReqdAdvcTp":{"DbtAdvc":{"Cd":"ADWD","Prtry":"Advice with transaction details"}},"ReqdExctnDt":{"Dt":"2023-02-03","DtTm":"2023-02-03T07:03:17.438Z"},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+36-432226947","SchmeNm":{"Prtry":"typolog028"}}}},"CtctDtls":{"MobNb":"+36-432226947"}},"DbtrAcct":{"Id":{"Othr":{"Id":"+36-432226947","SchmeNm":{"Prtry":"MSISDN"}}},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typolog028"}}},"CdtTrfTxInf":{"PmtId":{"EndToEndId":"8f37-9e6f-4c30-bb87-5e0e42f0f000"},"PmtTpInf":{"CtgyPurp":{"Prtry":"TRANSFER BLANK"}},"Amt":{"InstdAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"EqvtAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"},"CcyOfTrf":"USD"}},"ChrgBr":"DEBT","CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+42-966969344","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+42-966969344"}},"CdtrAcct":{"Id":{"Othr":{"Id":"+42-966969344","SchmeNm":{"Prtry":"MSISDN"}}},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Dbtr":{"FrstNm":"April","MddlNm":"Blake","LastNm":"Grant","MrchntClssfctnCd":"BLANK"},"Cdtr":{"FrstNm":"Felicia","MddlNm":"Easton","LastNm":"Quill","MrchntClssfctnCd":"BLANK"},"DbtrFinSvcsPrvdrFees":{"Ccy":"USD","Amt":307.14},"Xprtn":"2021-11-30T10:38:56.000Z"}}}}},"SplmtryData":{"Envlp":{"Doc":{"InitgPty":{"InitrTp":"CONSUMER","Glctn":{"Lat":"-3,1609","Long":"38,3588"}}}}}}}',
    );

  const getMockRequestPain013 = () =>
    JSON.parse(
      '{"TxTp":"pain.013.001.09","CdtrPmtActvtnReq":{"GrpHdr":{"MsgId":"53bf-5388-4aa3-ac23-6180ac1ce5ab","CreDtTm":"2023-02-01T12:47:23.470Z","NbOfTxs":1,"InitgPty":{"Nm":"Horatio Sam Ford","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1981-04-11","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+58-210165155","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+58-210165155"}}},"PmtInf":{"PmtInfId":"7a25e5694b8649d09702cc2162d07550","PmtMtd":"TRA","ReqdAdvcTp":{"DbtAdvc":{"Cd":"ADWD","Prtry":"Advice with transaction details"}},"ReqdExctnDt":{"DtTm":"2023-02-01T12:47:23.470Z"},"XpryDt":{"DtTm":"2023-02-01T12:47:23.470Z"},"Dbtr":{"Nm":"2023-02-01T12:47:23.470Z","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"2021-10-07","CityOfBirth":"Unknown","CtryOfBirth":"zz"},"Othr":{"Id":"ZZ","SchmeNm":{"Prtry":"+58-210165155"}}}},"CtctDtls":{"MobNb":"+58-210165155"}},"DbtrAcct":{"Id":{"Othr":{"Id":"+58-210165155","SchmeNm":{"Prtry":"+58-210165155"},"Nm":"PASSPORT"}}},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"Horatio Ford"}}},"CdtTrfTxInf":{"PmtId":{"EndToEndId":"02d5-dd5d-4995-a643-bd31c0a89e7a"},"PmtTpInf":{"CtgyPurp":{"Prtry":"TRANSFER"}},"Amt":{"InstdAmt":{"Amt":{"Amt":50431891779910900,"Ccy":"USD"}},"EqvtAmt":{"Amt":{"Amt":50431891779910900,"Ccy":"USD"},"CcyOfTrf":"USD"}},"ChrgBr":"DEBT","CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"April Sam Adamson","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1923-04-26","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+04-830018596","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+04-830018596"}},"CdtrAcct":{"Id":{"Othr":{"Id":"+04-830018596","SchmeNm":{"Prtry":"dfsp002"}}},"Nm":"April Adamson"},"Purp":{"Cd":"MP2P"},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 49932566118723700.89 from Ivan to April"},"SplmtryData":{"Envlp":{"Doc":{"PyeeRcvAmt":{"Amt":{"Amt":4906747824834590,"Ccy":"USD"}},"PyeeFinSvcsPrvdrFee":{"Amt":{"Amt":49067478248345.9,"Ccy":"USD"}},"PyeeFinSvcsPrvdrComssn":{"Amt":{"Amt":0,"Ccy":"USD"}}}}}}},"SplmtryData":{"Envlp":{"Doc":{"InitgPty":{"Glctn":{"Lat":"-3.1675","Long":"39.059"}}}}}}}',
    );

  const getMockRequestPacs008 = () =>
    JSON.parse(
      '{"TxTp":"pacs.008.001.10","FIToFICstmrCdt":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}',
    );

  const getMockRequestPacs002 = () =>
    JSON.parse(
      '{"TxTp":"pacs.002.001.12","FIToFIPmtSts":{"GrpHdr":{"MsgId":"136a-dbb6-43d8-a565-86b8f322411e","CreDtTm":"2023-02-03T09:53:58.069Z"},"TxInfAndSts":{"OrgnlInstrId":"5d158d92f70142a6ac7ffba30ac6c2db","OrgnlEndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd","TxSts":"ACCC","ChrgsInf":[{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typolog028"}}}},{"Amt":{"Amt":153.57,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typolog028"}}}},{"Amt":{"Amt":300.71,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}}}],"AccptncDtTm":"2023-02-03T09:53:58.069Z","InstgAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typolog028"}}},"InstdAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}}}}}',
    );

  beforeEach(() => {
    jest.spyOn(cacheDatabaseClient, 'addAccount').mockImplementation((hash: string) => {
      return Promise.resolve();
    });

    jest.spyOn(cacheDatabaseClient, 'addEntity').mockImplementation((entityId: string, CreDtTm: string) => {
      return Promise.resolve();
    });

    jest.spyOn(cacheDatabaseClient, 'addAccountHolder').mockImplementation((entityId: string, accountId: string, CreDtTm: string) => {
      return Promise.resolve();
    });

    jest.spyOn(cacheDatabaseClient, 'saveTransactionRelationship').mockImplementation((tR: TransactionRelationship) => {
      return Promise.resolve();
    });

    jest
      .spyOn(cacheDatabaseClient, 'saveTransactionHistory')
      .mockImplementation((transaction: any, transactionhistorycollection: string) => {
        return Promise.resolve();
      });

    jest.spyOn(databaseManager, 'getTransactionPain001').mockImplementation((pseudonym: any) => {
      return Promise.resolve([[getMockRequestPain001() as Pain001]]);
    });

    jest.spyOn(databaseManager, 'getTransactionPacs008').mockImplementation((pseudonym: any) => {
      return Promise.resolve([[getMockRequestPacs008() as Pacs008]]);
    });

    jest.spyOn(databaseManager, 'getJson').mockImplementation((key: any) => {
      return Promise.resolve(getMockRequestPain001().DataCache);
    });

    jest.spyOn(databaseManager, 'setJson').mockImplementation((pseudonym: any) => {
      return Promise.resolve();
    });

    jest.spyOn(server, 'handleResponse').mockImplementation(jest.fn());
  });

  describe('handleExecute', () => {
    it('should handle Quote', async () => {
      const request = getMockRequestPain001() as Pain001;

      const handleSpy = jest.spyOn(LogicService, 'handlePain001');

      await LogicService.handlePain001(request);
      expect(handleSpy).toBeCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle Quote, database error', async () => {
      const request = getMockRequestPain001() as Pain001;

      jest
        .spyOn(cacheDatabaseClient, 'saveTransactionHistory')
        .mockImplementation((transaction: any, transactionhistorycollection: string) => {
          return new Promise((resolve, reject) => {
            throw new Error('Deliberate Error');
          });
        });

      let error = '';
      try {
        await LogicService.handlePain001(request);
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('Deliberate Error');
    });
  });

  describe('handleQuoteReply', () => {
    it('should handle Quote Reply', async () => {
      const request = getMockRequestPain013() as Pain013;

      const handleSpy = jest.spyOn(LogicService, 'handlePain013');

      await LogicService.handlePain013(request);
      expect(handleSpy).toBeCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle Quote Reply, database error', async () => {
      const request = getMockRequestPain013() as Pain013;

      jest
        .spyOn(cacheDatabaseClient, 'saveTransactionHistory')
        .mockImplementation((transaction: any, transactionhistorycollection: string) => {
          return new Promise((resolve, reject) => {
            throw new Error('Deliberate Error');
          });
        });

      let error = '';
      try {
        await LogicService.handlePain013(request);
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('Deliberate Error');
    });
  });

  describe('handleTransfer', () => {
    it('should handle Transfer', async () => {
      const request = getMockRequestPacs008() as Pacs008;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

      await LogicService.handlePacs008(request);
      expect(handleSpy).toBeCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle Transfer, database error', async () => {
      jest
        .spyOn(cacheDatabaseClient, 'saveTransactionHistory')
        .mockImplementation((transaction: Pain001 | Pain013 | Pacs008 | Pacs002, transactionhistorycollection: string) => {
          return new Promise((resolve, reject) => {
            throw new Error('Deliberate Error');
          });
        });
      const request = getMockRequestPacs008() as Pacs008;

      let error = '';
      try {
        await LogicService.handlePacs008(request);
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('Deliberate Error');
    });
  });

  describe('handleTransfer, quoting enabled', () => {
    it('should handle Transfer', async () => {
      configuration.quoting = true;
      const request = getMockRequestPacs008() as Pacs008;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs008');

      await LogicService.handlePacs008(request);
      expect(handleSpy).toBeCalledTimes(1);
      expect(handleSpy).toHaveReturned();
      configuration.quoting = false;
    });
  });

  describe('handleTransferResponse', () => {
    it('should handle Transfer Response', async () => {
      jest.spyOn(cacheDatabaseClient, 'getTransactionHistoryPacs008').mockImplementation((EndToEndId: string) => {
        return Promise.resolve(
          JSON.parse(
            '[[{"TxTp":"pacs.008.001.10","FIToFICstmrCdt":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}]]',
          ),
        );
      });

      const request = getMockRequestPacs002() as Pacs002;

      const handleSpy = jest.spyOn(LogicService, 'handlePacs002');

      await LogicService.handlePacs002(request);
      expect(handleSpy).toBeCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });

    it('should handle Transfer Response, database error', async () => {
      jest.spyOn(cacheDatabaseClient, 'getTransactionHistoryPacs008').mockImplementation((EndToEndId: string) => {
        return new Promise((resolve, reject) => {
          throw new Error('Deliberate Error');
        });
      });
      const request = getMockRequestPacs002() as Pacs002;

      let error = '';
      try {
        await LogicService.handlePacs002(request);
      } catch (err: any) {
        error = err?.message;
      }
      expect(error).toEqual('Deliberate Error');
    });
  });

  describe('Error cases', () => {
    it('should fail gracefully - rebuildCache', async () => {
      const request = getMockRequestPacs002() as Pacs002;

      jest.spyOn(databaseManager, 'getJson').mockRejectedValue((key: any) => {
        return Promise.resolve('some error');
      });

      jest.spyOn(databaseManager, 'getTransactionPain001').mockImplementation((key: any) => {
        return Promise.resolve('');
      });

      jest.spyOn(databaseManager, 'getTransactionPacs008').mockImplementation((key: any) => {
        return Promise.resolve('');
      });

      jest.spyOn(cacheDatabaseClient, 'getTransactionHistoryPacs008').mockImplementation((key: any) => {
        return Promise.resolve([
          [
            JSON.parse(
              '{"TxTp":"pacs.008.001.10","FIToFICstmrCdt":{"GrpHdr":{"MsgId":"cabb-32c3-4ecf-944e-654855c80c38","CreDtTm":"2023-02-03T07:17:52.216Z","NbOfTxs":1,"SttlmInf":{"SttlmMtd":"CLRG"}},"CdtTrfTxInf":{"PmtId":{"InstrId":"4ca819baa65d4a2c9e062f2055525046","EndToEndId":"701b-ae14-46fd-a2cf-88dda2875fdd"},"IntrBkSttlmAmt":{"Amt":{"Amt":31020.89,"Ccy":"USD"}},"InstdAmt":{"Amt":{"Amt":9000,"Ccy":"ZAR"}},"ChrgBr":"DEBT","ChrgsInf":{"Amt":{"Amt":307.14,"Ccy":"USD"},"Agt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}}},"InitgPty":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+01-710694778"}},"Dbtr":{"Nm":"April Blake Grant","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1968-02-01","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+01-710694778"}},"DbtrAcct":{"Id":{"Othr":{"Id":"+01-710694778","SchmeNm":{"Prtry":"MSISDN"}}},"Nm":"April Grant"},"DbtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"typology003"}}},"CdtrAgt":{"FinInstnId":{"ClrSysMmbId":{"MmbId":"dfsp002"}}},"Cdtr":{"Nm":"Felicia Easton Quill","Id":{"PrvtId":{"DtAndPlcOfBirth":{"BirthDt":"1935-05-08","CityOfBirth":"Unknown","CtryOfBirth":"ZZ"},"Othr":{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}}},"CtctDtls":{"MobNb":"+07-197368463"}},"CdtrAcct":{"Id":{"Othr":{"Id":"+07-197368463","SchmeNm":{"Prtry":"MSISDN"}}},"Nm":"Felicia Quill"},"Purp":{"Cd":"MP2P"}},"RgltryRptg":{"Dtls":{"Tp":"BALANCE OF PAYMENTS","Cd":"100"}},"RmtInf":{"Ustrd":"Payment of USD 30713.75 from April to Felicia"},"SplmtryData":{"Envlp":{"Doc":{"Xprtn":"2023-02-03T07:17:52.216Z"}}}}}',
            ),
          ],
        ]);
      });

      const handleSpy = jest.spyOn(LogicService, 'handlePacs002');

      await LogicService.handlePacs002(request);
      expect(handleSpy).toBeCalledTimes(1);
      expect(handleSpy).toHaveReturned();
    });
  });
});
