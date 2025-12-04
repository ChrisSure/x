import { RowDataPacket } from 'mysql2/promise';

/**
 * Database article structure from articles table
 */
export interface DatabaseArticle extends RowDataPacket {
  id: number;
  link: string;
  content: string;
  date_string: string;
  title: string | null;
  img_link: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}
