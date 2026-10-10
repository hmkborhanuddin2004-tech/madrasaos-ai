import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { db } from '../server/src/db/db.js';
import { resolveGuardianRecipients } from '../server/src/utils/guardianResolver.js';
import { initializeDatabase } from '../server/src/db/schema.js';
import { seedDatabase } from '../server/src/db/seed.js';

describe('Export Features & Guardian Resolver', () => {
  let adminToken: string;

  beforeAll(async () => {
    await initializeDatabase();
    await seedDatabase();

    // Generate an admin token for tests
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'muhtamim', password: 'admin123' });
    
    adminToken = loginRes.body.data.token;

    // Update seeded students to test guardian grouping
    await db.exec(`
      UPDATE students SET guardian_phone = '01700000000', guardian_name_bn = 'G1' WHERE id IN ('std_001', 'std_002');
      UPDATE students SET guardian_phone = '', guardian_name_bn = 'G3' WHERE id = 'std_003';
    `);
  });

  it('CSV export returns 200 with correct Content-Type', async () => {
    const res = await request(app)
      .get('/api/v1/export/students.csv')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="students.csv"/);
  });

  it('Excel export returns 200 with xlsx Content-Type', async () => {
    const res = await request(app)
      .get('/api/v1/export/students.xlsx')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="students.xlsx"/);
  });

  it('guardian resolver deduplication: two students with same guardian phone -> one delivery entry', async () => {
    const { deliveries, skipped } = await resolveGuardianRecipients('inst_main', ['std_001', 'std_002'], db);
    expect(deliveries.length).toBe(1);
    expect(deliveries[0].phone).toBe('01700000000');
    expect(deliveries[0].students.length).toBe(2);
    expect(skipped.length).toBe(0);
  });

  it('guardian resolver skipped: student with no active guardian -> appears in skipped list', async () => {
    const { deliveries, skipped } = await resolveGuardianRecipients('inst_main', ['std_003'], db);
    expect(deliveries.length).toBe(0);
    expect(skipped.length).toBe(1);
    expect(skipped[0].studentId).toBe('std_003');
    expect(skipped[0].reason).toBe('Guardian has no phone number');
  });

});
