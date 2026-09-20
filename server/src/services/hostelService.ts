import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import { HostelRoom, HostelOutpass } from '../types/index.js';

export class HostelService {
  public async getHostelStatus(tenantId: string): Promise<any> {
    const rooms = await db.all<any>('SELECT * FROM hostel_rooms WHERE tenant_id = ?', [tenantId]);

    let totalCapacity = 0;
    let totalOccupied = 0;

    const parsedRooms = rooms.map((r) => {
      totalCapacity += r.capacity;
      totalOccupied += r.occupied;
      return {
        ...r,
        beds: JSON.parse(r.beds_json || '[]')
      };
    });

    const activeOutpasses = await db.all<any>(
      `SELECT o.*, s.full_name_bn, s.guardian_phone
       FROM hostel_outpasses o
       JOIN students s ON o.student_id = s.id
       WHERE o.tenant_id = ? AND o.status = 'approved'`,
      [tenantId]
    );

    return {
      totalRooms: rooms.length,
      totalCapacity,
      totalOccupied,
      availableBeds: Math.max(0, totalCapacity - totalOccupied),
      occupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
      activeOutpassesCount: activeOutpasses.length,
      rooms: parsedRooms,
      activeOutpasses
    };
  }

  public async issueOutpass(tenantId: string, payload: Partial<HostelOutpass>): Promise<any> {
    const id = `out_${uuidv4().slice(0, 8)}`;
    await db.run(
      `INSERT INTO hostel_outpasses (id, tenant_id, student_id, reason, departure_time, expected_return_time, status, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)`,
      [
        id, tenantId, payload.studentId, payload.reason || 'ছুটি',
        payload.departureTime || new Date().toISOString(),
        payload.expectedReturnTime || new Date().toISOString(),
        payload.approvedBy || 'হোস্টেল সুপার'
      ]
    );
    return { success: true, id };
  }
}

export const hostelService = new HostelService();
