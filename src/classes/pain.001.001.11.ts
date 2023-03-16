export interface Pain001 {
  TxTp: string;
  EndToEndId: string;
  CstmrCdtTrfInitn: CstmrCdtTrfInitn;
}

export interface CstmrCdtTrfInitn {
  GrpHdr: GrpHdr;
  PmtInf: PmtInf;
  SplmtryData: CstmrCdtTrfInitnSplmtryData;
}

export interface GrpHdr {
  MsgId: string;
  CreDtTm: string;
  NbOfTxs: number;
  InitgPty: InitgPty;
}

export interface InitgPty {
  Nm: string;
  Id: InitgPtyID;
  CtctDtls: CtctDtls;
}

export interface CtctDtls {
  MobNb: string;
}

export interface InitgPtyID {
  PrvtId: PrvtID;
}

export interface PrvtID {
  DtAndPlcOfBirth: DtAndPLCOfBirth;
  Othr: Othr;
}

export interface DtAndPLCOfBirth {
  BirthDt: Date;
  CityOfBirth: string;
  CtryOfBirth: string;
}

export interface Othr {
  Id: string;
  SchmeNm: CtgyPurp;
}

export interface CtgyPurp {
  Prtry: string;
}

export interface PmtInf {
  PmtInfId: string;
  PmtMtd: string;
  ReqdAdvcTp: ReqdAdvcTp;
  ReqdExctnDt: ReqdExctnDt;
  Dbtr: InitgPty;
  DbtrAcct: TrAcct;
  DbtrAgt: TrAgt;
  CdtTrfTxInf: CdtTrfTxInf;
}

export interface CdtTrfTxInf {
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

export interface Amt {
  InstdAmt: InstdAmt;
  EqvtAmt: EqvtAmt;
}

export interface EqvtAmt {
  Amt: DbtrFinSvcsPrvdrFeesClass;
  CcyOfTrf: string;
}

export interface DbtrFinSvcsPrvdrFeesClass {
  Amt: string;
  Ccy: string;
}

export interface InstdAmt {
  Amt: DbtrFinSvcsPrvdrFeesClass;
}

export interface TrAcct {
  Id: DbtrAcctID;
  Nm: string;
}

export interface DbtrAcctID {
  Othr: Othr;
}

export interface TrAgt {
  FinInstnId: FinInstnID;
}

export interface FinInstnID {
  ClrSysMmbId: CLRSysMmbID;
}

export interface CLRSysMmbID {
  MmbId: string;
}

export interface PmtID {
  EndToEndId: string;
}

export interface PmtTpInf {
  CtgyPurp: CtgyPurp;
}

export interface Purp {
  Cd: string;
}

export interface RgltryRptg {
  Dtls: Dtls;
}

export interface Dtls {
  Tp: string;
  Cd: string;
}

export interface RmtInf {
  Ustrd: string;
}

export interface CdtTrfTxInfSplmtryData {
  Envlp: PurpleEnvlp;
}

export interface PurpleEnvlp {
  Doc: PurpleDoc;
}

export interface PurpleDoc {
  Dbtr: Cdtr;
  Cdtr: Cdtr;
  DbtrFinSvcsPrvdrFees: DbtrFinSvcsPrvdrFeesClass;
  Xprtn: Date;
}

export interface Cdtr {
  FrstNm: string;
  MddlNm: string;
  LastNm: string;
  MrchntClssfctnCd: string;
}

export interface ReqdAdvcTp {
  DbtAdvc: DbtAdvc;
}

export interface DbtAdvc {
  Cd: string;
  Prtry: string;
}

export interface ReqdExctnDt {
  Dt: Date;
  DtTm: Date;
}

export interface CstmrCdtTrfInitnSplmtryData {
  Envlp: FluffyEnvlp;
}

export interface FluffyEnvlp {
  Doc: FluffyDoc;
}

export interface FluffyDoc {
  InitgPty: DocInitgPty;
}

export interface DocInitgPty {
  InitrTp: string;
  Glctn: Glctn;
}

export interface Glctn {
  Lat: string;
  Long: string;
}
