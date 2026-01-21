/**
 * SQL query constants for MySQL database operations
 */

export const GET_LAST_DAY_PUBLISHED_ARTICLES_QUERY = `SELECT id, link, content, created, title, image, status
         FROM articles
         WHERE status = ?
         AND created >= ?
         ORDER BY created DESC`;

/**
 * Insert a new article into the articles table
 */
export const INSERT_ARTICLE_QUERY = `INSERT INTO articles (link, content, created, title, image, status)
         VALUES (?, ?, ?, ?, ?, ?)`;

/**
 * Update article image by ID
 */
export const UPDATE_ARTICLE_IMAGE_QUERY = `UPDATE articles SET image = ? WHERE id = ?`;
