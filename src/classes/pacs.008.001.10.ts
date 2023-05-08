export interface Pacs008 {
  TxTp: string;
  FIToFICstmrCdt: FIToFICstmrCdt;

  EndToEndId: string;
  DebtorAcctId: string;
  CreditorAcctId: string;
  CreDtTm: string;
}

interface FIToFICstmrCdt {
  GrpHdr: GrpHdr;
  CdtTrfTxInf: CdtTrfTxInf;
  RgltryRptg: RgltryRptg;
  RmtInf: RmtInf;
  SplmtryData: SplmtryData;
}

interface CdtTrfTxInf {
  PmtId: PmtID;
  IntrBkSttlmAmt: InstdAmtClass;
  InstdAmt: InstdAmtClass;
  ChrgBr: string;
  ChrgsInf: ChrgsInf;
  InitgPty: Cdtr;
  Dbtr: Cdtr;
  DbtrAcct: TrAcct;
  DbtrAgt: Agt;
  CdtrAgt: Agt;
  Cdtr: Cdtr;
  CdtrAcct: TrAcct;
  Purp: Purp;
}

interface Cdtr {
  Nm: string;
  Id: CdtrID;
  CtctDtls: CtctDtls;
}

interface CtctDtls {
  MobNb: string;
}

interface CdtrID {
  PrvtId: PrvtID;
}

interface PrvtID {
  DtAndPlcOfBirth: DtAndPLCOfBirth;
  Othr: Othr;
}

interface DtAndPLCOfBirth {
  BirthDt: Date;
  CityOfBirth: string;
  CtryOfBirth: string;
}

interface Othr {
  Id: string;
  SchmeNm: SchmeNm;
}

interface SchmeNm {
  Prtry: string;
}

interface TrAcct {
  Id: CdtrAcctID;
  Nm: string;
}

interface CdtrAcctID {
  Othr: Othr;
}

interface Agt {
  FinInstnId: FinInstnID;
}

interface FinInstnID {
  ClrSysMmbId: CLRSysMmbID;
}

interface CLRSysMmbID {
  MmbId: string;
}

interface ChrgsInf {
  Amt: Amt;
  Agt: Agt;
}

interface Amt {
  Amt: string;
  Ccy: string;
}

interface InstdAmtClass {
  Amt: Amt;
}

interface PmtID {
  InstrId: string;
  EndToEndId: string;
}

interface Purp {
  Cd: string;
}

interface GrpHdr {
  MsgId: string;
  CreDtTm: string;
  NbOfTxs: number;
  SttlmInf: SttlmInf;
}

interface SttlmInf {
  SttlmMtd: string;
}

interface RgltryRptg {
  Dtls: Dtls;
}

interface Dtls {
  Tp: string;
  Cd: string;
}

interface RmtInf {
  Ustrd: string;
}

interface SplmtryData {
  Envlp: Envlp;
}

interface Envlp {
  Doc: Doc;
}

interface Doc {
  Xprtn: Date;
}
