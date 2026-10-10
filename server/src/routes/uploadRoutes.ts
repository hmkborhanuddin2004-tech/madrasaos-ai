import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db.js';

export const uploadRoutes = Router();

// Ensure base upload directory exists
const baseUploadDir = path.join(process.cwd(), 'uploads', 'photos');
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = req.headers['x-tenant-id'] as string || 'default';
    const type = req.body.type || 'other';
    const dateStr = new Date().toISOString().split('T')[0];
    
    const dir = path.join(baseUploadDir, tenantId, type, dateStr);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/v1/uploads/photo
uploadRoutes.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).user?.tenantId || 'inst_main';
    const userId = (req.headers['x-user-id'] as string) || (req as any).user?.id || 'system';

    let filePath = '';
    let fileSize = 0;
    
    const type = req.body.type || 'other';
    const refId = req.body.refId || null;
    const note = req.body.note || null;
    
    // Handle base64 upload
    if (req.body.photo && req.body.photo.startsWith('data:image')) {
      const dateStr = new Date().toISOString().split('T')[0];
      const dir = path.join(baseUploadDir, tenantId, type, dateStr);
      fs.mkdirSync(dir, { recursive: true });
      
      const matches = req.body.photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 string' });
      }
      
      const buffer = Buffer.from(matches[2], 'base64');
      const ext = matches[1].split('/')[1] === 'jpeg' ? '.jpg' : '.' + matches[1].split('/')[1];
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
      const fullPath = path.join(dir, filename);
      
      fs.writeFileSync(fullPath, buffer);
      
      const relativePath = path.posix.join('uploads', 'photos', tenantId, type, dateStr, filename);
      filePath = '/' + relativePath;
      fileSize = buffer.length;
    } 
    // Handle multipart upload
    else if (req.file) {
      const dateStr = new Date().toISOString().split('T')[0];
      const relativePath = path.posix.join('uploads', 'photos', tenantId, type, dateStr, req.file.filename);
      filePath = '/' + relativePath;
      fileSize = req.file.size;
    } 
    else {
      return res.status(400).json({ error: 'No photo provided' });
    }

    const fileId = uuidv4();
    const capturedAt = new Date().toISOString();
    
    await db.run(
      `INSERT INTO document_photos (id, tenant_id, type, ref_id, file_path, file_size, captured_by, captured_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fileId, tenantId, type, refId, filePath, fileSize, userId, capturedAt, note]
    );

    // If refId is a student or type is student avatar/doc, automatically link avatar_url
    if (refId) {
      await db.run(
        `UPDATE students SET avatar_url = ? WHERE id = ? OR student_id_number = ?`,
        [filePath, refId, refId]
      );
    }

    res.status(200).json({
      success: true,
      fileId,
      url: filePath,
      message: 'Photo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Dedicated public mobile upload endpoint for phone camera QR flow
uploadRoutes.post('/mobile-student-photo', upload.single('photo'), async (req, res) => {
  try {
    const studentId = req.body.studentId || req.query.studentId;
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'Student ID is required' });
    }

    const tenantId = (req.headers['x-tenant-id'] as string) || 'inst_main';
    let filePath = '';
    let fileSize = 0;

    if (req.body.photo && req.body.photo.startsWith('data:image')) {
      const dateStr = new Date().toISOString().split('T')[0];
      const dir = path.join(baseUploadDir, tenantId, 'student_avatar', dateStr);
      fs.mkdirSync(dir, { recursive: true });

      const matches = req.body.photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, error: 'Invalid base64 string' });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const ext = matches[1].split('/')[1] === 'jpeg' ? '.jpg' : '.' + matches[1].split('/')[1];
      const filename = `mobile-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      const fullPath = path.join(dir, filename);

      fs.writeFileSync(fullPath, buffer);
      filePath = '/' + path.posix.join('uploads', 'photos', tenantId, 'student_avatar', dateStr, filename);
      fileSize = buffer.length;
    } else if (req.file) {
      const dateStr = new Date().toISOString().split('T')[0];
      filePath = '/' + path.posix.join('uploads', 'photos', tenantId, 'student_avatar', dateStr, req.file.filename);
      fileSize = req.file.size;
    } else {
      return res.status(400).json({ success: false, error: 'No photo uploaded' });
    }

    const fileId = uuidv4();
    await db.run(
      `INSERT INTO document_photos (id, tenant_id, type, ref_id, file_path, file_size, captured_by, captured_at, note)
       VALUES (?, ?, 'student_avatar', ?, ?, ?, 'mobile_camera', ?, 'Uploaded via Mobile QR Flow')`,
      [fileId, tenantId, studentId, filePath, fileSize, new Date().toISOString()]
    );

    // Save to student record
    await db.run(
      `UPDATE students SET avatar_url = ? WHERE id = ? OR student_id_number = ?`,
      [filePath, studentId, studentId]
    );

    res.json({
      success: true,
      url: filePath,
      message: 'শিক্ষার্থীর ছবি সফলভাবে আপলোড হয়েছে।'
    });
  } catch (error) {
    console.error('Mobile upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload mobile photo' });
  }
});

// GET /api/v1/uploads/photos?type=payment_receipt&refId=PAY-001
uploadRoutes.get('/photos', async (req, res) => {
  try {
    const tenantId = (req.headers['x-tenant-id'] as string) || 'inst_main';
    const { type, refId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing X-Tenant-ID header' });
    }
    
    let query = 'SELECT * FROM document_photos WHERE tenant_id = ?';
    const params: any[] = [tenantId];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    if (refId) {
      query += ' AND ref_id = ?';
      params.push(refId);
    }
    
    query += ' ORDER BY captured_at DESC';
    
    const photos = await db.all(query, params);
    
    // Convert to proper output format
    const formattedPhotos = photos.map((p: any) => ({
      id: p.id,
      type: p.type,
      refId: p.ref_id,
      url: p.file_path,
      size: p.file_size,
      capturedBy: p.captured_by,
      capturedAt: p.captured_at,
      note: p.note
    }));
    
    res.json(formattedPhotos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// DELETE /api/v1/uploads/photos/:id
uploadRoutes.delete('/photos/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    // Check if user is admin or accountant (simplified check, usually we'd use middleware)
    const userRole = req.headers['x-user-role'] as string;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing X-Tenant-ID header' });
    }
    
    if (userRole !== 'admin' && userRole !== 'accountant' && userRole !== 'superadmin') {
      // Allow for testing without full auth, maybe return error if role explicitly provided as student etc
      if (userRole) {
         return res.status(403).json({ error: 'Unauthorized to delete photos' });
      }
    }
    
    const { id } = req.params;
    
    const photo = await db.get(
      'SELECT * FROM document_photos WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Delete file from filesystem
    try {
      const fullPath = path.join(process.cwd(), photo.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {
      console.error('Error deleting file:', e);
      // Continue even if file delete fails
    }
    
    // Delete from DB
    await db.run(
      'DELETE FROM document_photos WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    
    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default uploadRoutes;
