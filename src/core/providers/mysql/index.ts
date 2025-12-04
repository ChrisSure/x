/**
 * MySQL Provider Module
 * Provides singleton instance of MySQL provider for application-wide use
 */

import { MySQLProvider } from './mysql.provider';

export { MySQLProvider, MySQLProviderError } from './mysql.provider';
export type {
  MySQLConfig,
  QueryResult,
  PoolStats,
  QueryParams,
  MySQLQueryResult,
  Pool,
  PoolConnection,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
} from './interfaces';

/**
 * Singleton instance of MySQL provider
 * Import this to use MySQL services throughout the application
 *
 * @example
 * ```typescript
 * import { mySQLProvider } from '@/core/providers/mysql';
 *
 * const users = await mySQLProvider.query<RowDataPacket[]>(
 *   'SELECT * FROM users WHERE status = ?',
 *   ['active']
 * );
 * ```
 */
export const mySQLProvider = new MySQLProvider();
