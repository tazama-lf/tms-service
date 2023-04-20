export interface Pain001 {
  TxTp: string;
  CstmrCdtTrfInitn: CstmrCdtTrfInitn;

  EndToEndId: string;
  DebtorAcctId: string;
  CreditorAcctId: string;
  CreDtTm: string;
}

interface CstmrCdtTrfInitn {
  GrpHdr: GrpHdr;
  PmtInf: PmtInf;
  SplmtryData: CstmrCdtTrfInitnSplmtryData;
}

interface GrpHdr {
  MsgId: string;
  CreDtTm: string;
  NbOfTxs: number;
  InitgPty: InitgPty;
}

interface InitgPty {
  Nm: string;
  Id: InitgPtyID;
  CtctDtls: CtctDtls;
}

interface CtctDtls {
  MobNb: string;
}

interface InitgPtyID {
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
  SchmeNm: CtgyPurp;
}

interface CtgyPurp {
  Prtry: string;
}

interface PmtInf {
  PmtInfId: string;
  PmtMtd: string;
  ReqdAdvcTp: ReqdAdvcTp;
  ReqdExctnDt: ReqdExctnDt;
  Dbtr: InitgPty;
  DbtrAcct: TrAcct;
  DbtrAgt: TrAgt;
  CdtTrfTxInf: CdtTrfTxInf;
}

interface CdtTrfTxInf {
  PmtId: PmtID;
  PmtTpInf: PmtTpInf;
  Amt: Amt;
  ChrgBr: string;
  CdtrAgt: TrAgt;
  Cdtr: InitgPty;
  CdtrAcct: TrAcct;
  Purp: Purp;
  RgltryRptg: RgltryRptg;
  RmtInf: RmtInf;
  SplmtryData: CdtTrfTxInfSplmtryData;
}

interface Amt {
  InstdAmt: InstdAmt;
  EqvtAmt: EqvtAmt;
}

interface EqvtAmt {
  Amt: DbtrFinSvcsPrvdrFeesClass;
  CcyOfTrf: string;
}

interface DbtrFinSvcsPrvdrFeesClass {
  Amt: string;
  Ccy: string;
}

interface InstdAmt {
  Amt: DbtrFinSvcsPrvdrFeesClass;
}

interface TrAcct {
  Id: DbtrAcctID;
  Nm: string;
}

interface DbtrAcctID {
  Othr: Othr;
}

interface TrAgt {
  FinInstnId: FinInstnID;
}

interface FinInstnID {
  ClrSysMmbId: CLRSysMmbID;
}

interface CLRSysMmbID {
  MmbId: string;
}

interface PmtID {
  EndToEndId: string;
}

interface PmtTpInf {
  CtgyPurp: CtgyPurp;
}

interface Purp {
  Cd: string;
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

interface CdtTrfTxInfSplmtryData {
  Envlp: PurpleEnvlp;
}

interface PurpleEnvlp {
  Doc: PurpleDoc;
}

interface PurpleDoc {
  Dbtr: Cdtr;
  Cdtr: Cdtr;
  DbtrFinSvcsPrvdrFees: DbtrFinSvcsPrvdrFeesClass;
  Xprtn: Date;
}

interface Cdtr {
  FrstNm: string;
  MddlNm: string;
  LastNm: string;
  MrchntClssfctnCd: string;
}

interface ReqdAdvcTp {
  DbtAdvc: DbtAdvc;
}

interface DbtAdvc {
  Cd: string;
  Prtry: string;
}

interface ReqdExctnDt {
  Dt: Date;
  DtTm: Date;
}

interface CstmrCdtTrfInitnSplmtryData {
  Envlp: FluffyEnvlp;
}

interface FluffyEnvlp {
  Doc: FluffyDoc;
}

interface FluffyDoc {
  InitgPty: DocInitgPty;
}

interface DocInitgPty {
  InitrTp: string;
  Glctn: Glctn;
}

interface Glctn {
  Lat: string;
  Long: string;
}
