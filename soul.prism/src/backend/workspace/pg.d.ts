declare module "pg" {
  export interface QueryResult<T> {
    rows: T[];
  }

  export interface PoolClient {
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    release(): void;
  }

  export class Pool {
    constructor(config?: { connectionString?: string });
    connect(): Promise<PoolClient>;
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  }
}
