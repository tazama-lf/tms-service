export interface Pain013 {
  TxTp: string;
  EndToEndId: string;
  CdtrPmtActvtnReq: CdtrPmtActvtnReq;
  _key?: string;
}

interface CdtrPmtActvtnReq {
  GrpHdr: GrpHdr;
  PmtInf: PmtInf;
  SplmtryData: CdtrPmtActvtnReqSplmtryData;
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
  Othr: PrvtIDOthr;
}

interface DtAndPLCOfBirth {
  BirthDt: Date;
  CityOfBirth: string;
  CtryOfBirth: string;
}

interface PrvtIDOthr {
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
  ReqdExctnDt: Dt;
  XpryDt: Dt;
  Dbtr: InitgPty;
  DbtrAcct: DbtrAcct;
  DbtrAgt: TrAgt;
  CdtTrfTxInf: CdtTrfTxInf;
}

interface CdtTrfTxInf {
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

interface CdtTrfTxInfAmt {
  InstdAmt: InstdAmt;
  EqvtAmt: EqvtAmt;
}

interface EqvtAmt {
  Amt: EqvtAmtAmt;
  CcyOfTrf: string;
}

interface EqvtAmtAmt {
  Amt: string;
  Ccy: string;
}

interface InstdAmt {
  Amt: EqvtAmtAmt;
}

interface CdtrAcct {
  Id: CdtrAcctID;
  Nm: string;
}

interface CdtrAcctID {
  Othr: PrvtIDOthr;
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
  PyeeRcvAmt: InstdAmt;
  PyeeFinSvcsPrvdrFee: InstdAmt;
  PyeeFinSvcsPrvdrComssn: InstdAmt;
}

interface DbtrAcct {
  Id: DbtrAcctID;
}

interface DbtrAcctID {
  Othr: PurpleOthr;
}

interface PurpleOthr {
  Id: string;
  SchmeNm: CtgyPurp;
  Nm: string;
}

interface ReqdAdvcTp {
  DbtAdvc: DbtAdvc;
}

interface DbtAdvc {
  Cd: string;
  Prtry: string;
}

interface Dt {
  DtTm: Date;
}

interface CdtrPmtActvtnReqSplmtryData {
  Envlp: FluffyEnvlp;
}

interface FluffyEnvlp {
  Doc: FluffyDoc;
}

interface FluffyDoc {
  InitgPty: DocInitgPty;
}

interface DocInitgPty {
  Glctn: Glctn;
}

interface Glctn {
  Lat: string;
  Long: string;
}
