import mysql from 'mysql2/promise';
import { logger } from '@/core/services/logger/logger.service';
import type {
  MySQLConfig,
  QueryResult,
  PoolStats,
  QueryParams,
  MySQLQueryResult,
  Pool,
  PoolConnection,
  ResultSetHeader,
} from './interfaces';

/**
 * Custom error class for MySQL provider errors
 */
export class MySQLProviderError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly errno?: number
  ) {
    super(message);
    this.name = 'MySQLProviderError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * MySQL Provider Service
 * Provides connection pooling and database operations for MySQL
 */
export class MySQLProvider {
  private pool: Pool | null = null;
  private isInitialized: boolean = false;
  private config: MySQLConfig;

  constructor() {
    // Validate and load configuration from environment variables
    const host = process.env['DB_HOST'];
    const port = process.env['DB_PORT'];
    const user = process.env['DB_USER'];
    const password = process.env['DB_PASSWORD'];
    const database = process.env['DB_NAME'];
    const connectionLimit = process.env['DB_CONNECTION_LIMIT'];

    if (!host || !user || !password || !database) {
      throw new MySQLProviderError(
        'Missing required MySQL environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)',
        'MISSING_CONFIG'
      );
    }

    this.config = {
      host,
      port: port ? parseInt(port, 10) : 3306,
      user,
      password,
      database,
      connectionLimit: connectionLimit ? parseInt(connectionLimit, 10) : 10,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };

    this.initializePool();
  }

  /**
   * Initializes the connection pool
   * @private
   */
  private initializePool(): void {
    try {
      this.pool = mysql.createPool(this.config);
      this.isInitialized = true;
      logger.info('MySQL Provider initialized successfully', {
        host: this.config.host,
        database: this.config.database,
        connectionLimit: this.config.connectionLimit,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to initialize MySQL connection pool', { error: errorMessage });
      throw new MySQLProviderError(
        `Failed to initialize MySQL connection pool: ${errorMessage}`,
        'POOL_INIT_ERROR'
      );
    }
  }

  /**
   * Validates that the provider is initialized
   * @throws {MySQLProviderError} If provider is not initialized
   * @private
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.pool) {
      throw new MySQLProviderError('MySQL Provider is not initialized', 'NOT_INITIALIZED');
    }
  }

  /**
   * Executes a SQL query with optional parameters (SELECT queries)
   * @param sql - SQL query string
   * @param params - Query parameters for prepared statement
   * @returns Promise with query results
   * @throws {MySQLProviderError} If the query fails
   *
   * @example
   * ```typescript
   * const users = await mySQLProvider.query<RowDataPacket[]>(
   *   'SELECT * FROM users WHERE status = ?',
   *   ['active']
   * );
   * ```
   */
  async query<T extends MySQLQueryResult>(
    sql: string,
    params?: QueryParams
  ): Promise<QueryResult<T>> {
    this.ensureInitialized();

    try {
      if (!sql || sql.trim().length === 0) {
        throw new MySQLProviderError('SQL query cannot be empty', 'INVALID_QUERY');
      }

      logger.info('Executing MySQL query', {
        sql: sql.substring(0, 100), // Log first 100 chars
        paramsCount: params?.length || 0,
      });

      const [rows, fields] = await this.pool!.query<T>(sql, params);

      logger.info('Query executed successfully', {
        rowCount: Array.isArray(rows) ? rows.length : 1,
      });

      return {
        data: rows,
        fields,
      };
    } catch (error) {
      logger.error('Query execution failed', {
        error,
        sql: sql.substring(0, 100),
      });

      if (error instanceof MySQLProviderError) {
        throw error;
      }

      // Handle mysql2 errors
      if (error && typeof error === 'object' && 'code' in error && 'errno' in error) {
        const mysqlError = error as { code: string; errno: number; message: string };
        throw new MySQLProviderError(
          `MySQL error: ${mysqlError.message}`,
          mysqlError.code,
          mysqlError.errno
        );
      }

      throw new MySQLProviderError(
        `Unexpected error during query execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Executes a SQL statement (INSERT, UPDATE, DELETE)
   * @param sql - SQL statement string
   * @param params - Statement parameters for prepared statement
   * @returns Promise with execution result
   * @throws {MySQLProviderError} If the execution fails
   *
   * @example
   * ```typescript
   * const result = await mySQLProvider.execute(
   *   'INSERT INTO articles (title, content) VALUES (?, ?)',
   *   ['My Title', 'Content']
   * );
   * console.log('Inserted ID:', result.data.insertId);
   * ```
   */
  async execute(sql: string, params?: QueryParams): Promise<QueryResult<ResultSetHeader>> {
    this.ensureInitialized();

    try {
      if (!sql || sql.trim().length === 0) {
        throw new MySQLProviderError('SQL statement cannot be empty', 'INVALID_STATEMENT');
      }

      logger.info('Executing MySQL statement', {
        sql: sql.substring(0, 100),
        paramsCount: params?.length || 0,
      });

      const [result] = await this.pool!.execute<ResultSetHeader>(sql, params);

      logger.info('Statement executed successfully', {
        affectedRows: result.affectedRows,
        insertId: result.insertId,
      });

      return {
        data: result,
      };
    } catch (error) {
      logger.error('Statement execution failed', {
        error,
        sql: sql.substring(0, 100),
      });

      if (error instanceof MySQLProviderError) {
        throw error;
      }

      if (error && typeof error === 'object' && 'code' in error && 'errno' in error) {
        const mysqlError = error as { code: string; errno: number; message: string };
        throw new MySQLProviderError(
          `MySQL error: ${mysqlError.message}`,
          mysqlError.code,
          mysqlError.errno
        );
      }

      throw new MySQLProviderError(
        `Unexpected error during statement execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Gets a connection from the pool for manual transaction management
   * Remember to release the connection when done
   * @returns Promise with pool connection
   * @throws {MySQLProviderError} If connection cannot be obtained
   *
   * @example
   * ```typescript
   * const connection = await mySQLProvider.getConnection();
   * try {
   *   await connection.beginTransaction();
   *   await connection.query('INSERT INTO ...');
   *   await connection.query('UPDATE ...');
   *   await connection.commit();
   * } catch (error) {
   *   await connection.rollback();
   *   throw error;
   * } finally {
   *   connection.release();
   * }
   * ```
   */
  async getConnection(): Promise<PoolConnection> {
    this.ensureInitialized();

    try {
      logger.info('Getting connection from pool');
      const connection = await this.pool!.getConnection();
      logger.info('Connection obtained successfully');
      return connection;
    } catch (error) {
      logger.error('Failed to get connection from pool', { error });

      if (error && typeof error === 'object' && 'code' in error && 'errno' in error) {
        const mysqlError = error as { code: string; errno: number; message: string };
        throw new MySQLProviderError(
          `MySQL connection error: ${mysqlError.message}`,
          mysqlError.code,
          mysqlError.errno
        );
      }

      throw new MySQLProviderError(
        `Failed to get connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_ERROR'
      );
    }
  }

  /**
   * Gets current connection pool statistics
   * @returns Pool statistics
   *
   * @example
   * ```typescript
   * const stats = mySQLProvider.getPoolStats();
   * console.log(`Active connections: ${stats.activeConnections}`);
   * ```
   */
  getPoolStats(): PoolStats {
    this.ensureInitialized();

    // mysql2 doesn't expose detailed pool stats, so we provide basic info
    // For production monitoring, consider implementing custom tracking
    return {
      totalConnections: this.config.connectionLimit || 10,
      activeConnections: 0, // Not available in mysql2
      idleConnections: 0, // Not available in mysql2
      queuedRequests: 0, // Not available in mysql2
    };
  }

  /**
   * Tests the database connection
   * @returns Promise that resolves if connection is successful
   * @throws {MySQLProviderError} If connection test fails
   *
   * @example
   * ```typescript
   * await mySQLProvider.testConnection();
   * console.log('Database connection is healthy');
   * ```
   */
  async testConnection(): Promise<void> {
    this.ensureInitialized();

    try {
      logger.info('Testing MySQL connection');
      await this.pool!.query('SELECT 1');
      logger.info('MySQL connection test successful');
    } catch (error) {
      logger.error('MySQL connection test failed', { error });

      if (error && typeof error === 'object' && 'code' in error && 'errno' in error) {
        const mysqlError = error as { code: string; errno: number; message: string };
        throw new MySQLProviderError(
          `MySQL connection test failed: ${mysqlError.message}`,
          mysqlError.code,
          mysqlError.errno
        );
      }

      throw new MySQLProviderError(
        `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_TEST_FAILED'
      );
    }
  }

  /**
   * Closes the connection pool gracefully
   * Should be called during application shutdown
   * @returns Promise that resolves when pool is closed
   *
   * @example
   * ```typescript
   * process.on('SIGTERM', async () => {
   *   await mySQLProvider.close();
   *   process.exit(0);
   * });
   * ```
   */
  async close(): Promise<void> {
    if (this.pool && this.isInitialized) {
      try {
        logger.info('Closing MySQL connection pool');
        await this.pool.end();
        this.isInitialized = false;
        this.pool = null;
        logger.info('MySQL connection pool closed successfully');
      } catch (error) {
        logger.error('Error closing MySQL connection pool', { error });
        throw new MySQLProviderError(
          `Failed to close connection pool: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'CLOSE_ERROR'
        );
      }
    }
  }

  /**
   * Gets the underlying mysql2 pool instance
   * Use with caution - prefer using the provider methods
   * @returns The mysql2 pool instance
   */
  getPool(): Pool {
    this.ensureInitialized();
    return this.pool!;
  }
}
