export interface Pain013 {
  TxTp: string;
  EndToEndId: string;
  CdtrPmtActvtnReq: CdtrPmtActvtnReq;
  _key?: string;
}

export interface CdtrPmtActvtnReq {
  GrpHdr: GrpHdr;
  PmtInf: PmtInf;
  SplmtryData: CdtrPmtActvtnReqSplmtryData;
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
  Othr: PrvtIDOthr;
}

export interface DtAndPLCOfBirth {
  BirthDt: Date;
  CityOfBirth: string;
  CtryOfBirth: string;
}

export interface PrvtIDOthr {
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
  ReqdExctnDt: Dt;
  XpryDt: Dt;
  Dbtr: InitgPty;
  DbtrAcct: DbtrAcct;
  DbtrAgt: TrAgt;
  CdtTrfTxInf: CdtTrfTxInf;
}

export interface CdtTrfTxInf {
  PmtId: PmtID;
  PmtTpInf: PmtTpInf;
  Amt: CdtTrfTxInfAmt;
  ChrgBr: string;
  CdtrAgt: TrAgt;
  Cdtr: InitgPty;
  CdtrAcct: CdtrAcct;
  Purp: Purp;
  RgltryRptg: RgltryRptg;
  RmtInf: RmtInf;
  SplmtryData: CdtTrfTxInfSplmtryData;
}

export interface CdtTrfTxInfAmt {
  InstdAmt: InstdAmt;
  EqvtAmt: EqvtAmt;
}

export interface EqvtAmt {
  Amt: EqvtAmtAmt;
  CcyOfTrf: string;
}

export interface EqvtAmtAmt {
  Amt: string;
  Ccy: string;
}

export interface InstdAmt {
  Amt: EqvtAmtAmt;
}

export interface CdtrAcct {
  Id: CdtrAcctID;
  Nm: string;
}

export interface CdtrAcctID {
  Othr: PrvtIDOthr;
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
  PyeeRcvAmt: InstdAmt;
  PyeeFinSvcsPrvdrFee: InstdAmt;
  PyeeFinSvcsPrvdrComssn: InstdAmt;
}

export interface DbtrAcct {
  Id: DbtrAcctID;
}

export interface DbtrAcctID {
  Othr: PurpleOthr;
}

export interface PurpleOthr {
  Id: string;
  SchmeNm: CtgyPurp;
  Nm: string;
}

export interface ReqdAdvcTp {
  DbtAdvc: DbtAdvc;
}

export interface DbtAdvc {
  Cd: string;
  Prtry: string;
}

export interface Dt {
  DtTm: Date;
}

export interface CdtrPmtActvtnReqSplmtryData {
  Envlp: FluffyEnvlp;
}

export interface FluffyEnvlp {
  Doc: FluffyDoc;
}

export interface FluffyDoc {
  InitgPty: DocInitgPty;
}

export interface DocInitgPty {
  Glctn: Glctn;
}

export interface Glctn {
  Lat: string;
  Long: string;
}
