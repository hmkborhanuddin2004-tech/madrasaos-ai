import { db } from '../../dist/server/db/db.js';

async function main() {
  const before = await db.get("SELECT id, status FROM payroll_vouchers WHERE id = 'vch_02'");
  console.log('Before reset:', before);

  await db.run(`
    UPDATE payroll_vouchers 
    SET status = 'muhtamim_approved', 
        disbursed_by = NULL, 
        disbursement_method = NULL, 
        transaction_reference = NULL, 
        disbursed_at = NULL 
    WHERE id = 'vch_02'
  `);

  const after = await db.get("SELECT id, status FROM payroll_vouchers WHERE id = 'vch_02'");
  console.log('After reset:', after);

  await db.close();
}

main().catch(console.error);
