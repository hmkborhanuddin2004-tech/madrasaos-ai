import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

export class LibraryService {
  public async getBooks(tenantId: string, search?: string): Promise<any[]> {
    let sql = 'SELECT * FROM library_books WHERE tenant_id = ?';
    const params: any[] = [tenantId];
    if (search) {
      sql += ' AND (title_bn LIKE ? OR author LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY title_bn ASC';
    return db.all<any>(sql, params);
  }

  public async addBook(tenantId: string, payload: any): Promise<any> {
    const id = `book_${uuidv4().slice(0, 8)}`;
    await db.run(
      `INSERT INTO library_books (id, tenant_id, title_bn, title_ar, author, category, isbn, total_copies, available_copies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, payload.titleBn || '', payload.titleAr || null,
        payload.author || '', payload.category || 'সাধারণ',
        payload.isbn || null, payload.totalCopies || 5, payload.totalCopies || 5
      ]
    );
    return { success: true, id };
  }
}

export const libraryService = new LibraryService();
