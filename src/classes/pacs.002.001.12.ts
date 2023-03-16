export interface Pacs002 {
  TxTp: string;
  EndToEndId: string;
  FIToFIPmtSts: FIToFIPmtSts;
  _key?: string;
}

export interface FIToFIPmtSts {
  GrpHdr: GrpHdr;
  TxInfAndSts: TxInfAndSts;
}

export interface GrpHdr {
  MsgId: string;
  CreDtTm: string;
}

export interface TxInfAndSts {
  OrgnlInstrId: string;
  OrgnlEndToEndId: string;
  TxSts: string;
  ChrgsInf: ChrgsInf[];
  AccptncDtTm: Date;
  InstgAgt: Agt;
  InstdAgt: Agt;
}

export interface ChrgsInf {
  Amt: Amt;
  Agt: Agt;
}

export interface Agt {
  FinInstnId: FinInstnID;
}

export interface FinInstnID {
  ClrSysMmbId: CLRSysMmbID;
}

export interface CLRSysMmbID {
  MmbId: string;
}

export interface Amt {
  Amt: number;
  Ccy: string;
}
