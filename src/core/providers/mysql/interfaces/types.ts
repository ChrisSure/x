import type {
  Pool,
  PoolConnection,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
} from 'mysql2/promise';

/**
 * MySQL connection configuration
 */
export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  waitForConnections?: boolean;
  queueLimit?: number;
  enableKeepAlive?: boolean;
  keepAliveInitialDelay?: number;
}

/**
 * Generic query result wrapper
 */
export interface QueryResult<T> {
  data: T;
  fields?: unknown[];
}

/**
 * Connection pool statistics
 */
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  queuedRequests: number;
}

/**
 * MySQL query parameters type
 */
export type QueryParams = (string | number | boolean | null | Date)[];

/**
 * MySQL result types
 */
export type MySQLQueryResult =
  | RowDataPacket[]
  | RowDataPacket[][]
  | OkPacket
  | OkPacket[]
  | ResultSetHeader;

/**
 * Re-export mysql2 types for convenience
 */
export type { Pool, PoolConnection, RowDataPacket, OkPacket, ResultSetHeader };

/**
 * Re-export database entity interfaces
 */
export type { DatabaseArticle } from './database-article.interface';
