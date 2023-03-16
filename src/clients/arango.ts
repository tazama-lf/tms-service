import { aql, Database } from 'arangojs';
import { AqlQuery } from 'arangojs/aql';
import apm from 'elastic-apm-node';
import * as fs from 'fs';
import { configuration } from '../config';
import { TransactionRelationship } from '../interfaces/iTransactionRelationship';
import { LoggerService } from '../logger.service';

export class ArangoDBService {
  private transactionHistoryClient: Database;
  private pseudonymsClient: Database;

  constructor() {
    const caOption = fs.existsSync(configuration.cert) ? [fs.readFileSync(configuration.cert)] : [];
    if (caOption.length === 0) LoggerService.warn('🟠 ArangoDB was not supplied with a certificate');
    this.pseudonymsClient = new Database({
      url: configuration.db.url,
      databaseName: configuration.db.pseudonymsdb,
      auth: {
        username: configuration.db.user,
        password: configuration.db.password,
      },
      agentOptions: {
        ca: caOption,
      },
    });

    this.transactionHistoryClient = new Database({
      url: configuration.db.url,
      databaseName: configuration.db.transactionhistorydb,
      auth: {
        username: configuration.db.user,
        password: configuration.db.password,
      },
      agentOptions: {
        ca: caOption,
      },
    });

    if (this.pseudonymsClient.isArangoDatabase) {
      LoggerService.log('✅ ArangoDB connection is ready');
    } else {
      LoggerService.error('❌ ArangoDB connection is not ready');
      throw new Error('ArangoDB connection is not ready');
    }
  }

  async query(query: AqlQuery, client: Database): Promise<unknown> {
    const span = apm.startSpan(`Query in ${client.name}`);
    try {
      const cycles = await client.query(query);
      const results = await cycles.batches.all();

      span?.end();
      LoggerService.log(`Query result: ${JSON.stringify(results)}`);

      return results;
    } catch (error) {
      LoggerService.error('Error while executing query from arango with message:', error as Error, 'ArangoDBService');
      throw new Error(`Error while executing query from arango with message: ${error as Error}`);
    }
  }

  async save(client: Database, collectionName: string, data: any, saveOptions?: any): Promise<void> {
    const span = apm.startSpan(`Save ${collectionName} document in ${client.name}`);
    try {
      await client.collection(collectionName).save(data, saveOptions || undefined);
      span?.end();
    } catch (error) {
      LoggerService.error(`Error while saving data to collection ${collectionName} with document\n ${JSON.stringify(data)}`);
      if (saveOptions) LoggerService.error(`With save options: ${JSON.stringify(saveOptions)}`);
      LoggerService.error(JSON.stringify(error));
      throw new Error(`Error while saving data to collection ${collectionName}`);
    }
  }

  async getPseudonyms(hash: string): Promise<any> {
    const db = this.pseudonymsClient.collection(configuration.db.pseudonymscollection);
    const query = aql`FOR i IN ${db}
        FILTER i.pseudonym == ${hash}
        RETURN i`;

    return this.query(query, this.pseudonymsClient);
  }

  async getTransactionHistoryPacs008(EndToEndId: string): Promise<any> {
    const db = this.transactionHistoryClient.collection(configuration.db.transactionhistory_pacs008_collection);
    const query = aql`FOR doc IN ${db} 
      FILTER doc.EndToEndId == ${EndToEndId} 
      RETURN doc`;

    return this.query(query, this.transactionHistoryClient);
  }

  async addAccount(hash: string): Promise<any> {
    return this.save(this.pseudonymsClient, 'accounts', { _key: hash }, { overwriteMode: 'ignore' });
  }

  async addEntity(entityId: string, CreDtTm: string): Promise<any> {
    return this.save(
      this.pseudonymsClient,
      'entities',
      {
        _key: entityId,
        Id: entityId,
        CreDtTm: CreDtTm,
      },
      { overwriteMode: 'ignore' },
    );
  }

  async addAccountHolder(entityId: string, accountId: string, CreDtTm: string): Promise<any> {
    return this.save(
      this.pseudonymsClient,
      'account_holder',
      {
        _from: `entities/${entityId}`,
        _to: `accounts/${accountId}`,
        CreDtTm: CreDtTm,
      },
      { overwriteMode: 'ignore' },
    );
  }

  async saveTransactionRelationship(tR: TransactionRelationship): Promise<any> {
    return this.save(
      this.pseudonymsClient,
      'transactionRelationship',
      {
        _key: tR.MsgId,
        _from: tR.from,
        _to: tR.to,
        TxTp: tR.TxTp,
        CreDtTm: tR.CreDtTm,
        Amt: tR.Amt,
        Ccy: tR.Ccy,
        PmtInfId: tR.PmtInfId,
        EndToEndId: tR.EndToEndId,
        lat: tR.lat,
        long: tR.long,
      },
      { overwriteMode: 'ignore' },
    );
  }

  async saveTransactionHistory(transaction: any, transactionhistorycollection: string): Promise<any> {
    return this.save(this.transactionHistoryClient, transactionhistorycollection, transaction, {
      overwriteMode: 'ignore',
    });
  }

  async savePseudonym(pseudonym: any): Promise<any> {
    return this.save(this.pseudonymsClient, configuration.db.pseudonymscollection, pseudonym, {
      overwriteMode: 'ignore',
    });
  }
}
