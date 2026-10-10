import { db } from '../src/db/db.js';

async function seed() {
  console.log('Connecting to database...');

  // 1. Add madrasa_type to classes if not exists
  const classCols = await db.all<any>('PRAGMA table_info(classes)');
  if (!classCols.some(c => c.name === 'madrasa_type')) {
    await db.run("ALTER TABLE classes ADD COLUMN madrasa_type TEXT DEFAULT 'qawmi'");
    console.log('Added madrasa_type to classes');
  }

  // 2. Add madrasa_type to class_definitions if not exists
  try {
    const defCols = await db.all<any>('PRAGMA table_info(class_definitions)');
    if (defCols && !defCols.some(c => c.name === 'madrasa_type')) {
      await db.run("ALTER TABLE class_definitions ADD COLUMN madrasa_type TEXT DEFAULT 'qawmi'");
      console.log('Added madrasa_type to class_definitions');
    }
  } catch (e: any) {
    console.warn(e.message);
  }

  // 3. Mark existing classes as qawmi
  await db.run("UPDATE classes SET madrasa_type = 'qawmi' WHERE madrasa_type IS NULL");

  // 4. Insert Alia classes
  const aliaClasses = [
    { id: 'cls_ibtedaee_1', name_bn: 'ইবতেদায়ী ১ম শ্রেণি', name_en: 'Ibtedaee 1', dept: 'ইবতেদায়ী স্তর (প্রাথমিক)', order: 20 },
    { id: 'cls_ibtedaee_2', name_bn: 'ইবতেদায়ী ২য় শ্রেণি', name_en: 'Ibtedaee 2', dept: 'ইবতেদায়ী স্তর (প্রাথমিক)', order: 21 },
    { id: 'cls_ibtedaee_3', name_bn: 'ইবতেদায়ী ৩য় শ্রেণি', name_en: 'Ibtedaee 3', dept: 'ইবতেদায়ী স্তর (প্রাথমিক)', order: 22 },
    { id: 'cls_ibtedaee_4', name_bn: 'ইবতেদায়ী ৪র্থ শ্রেণি', name_en: 'Ibtedaee 4', dept: 'ইবতেদায়ী স্তর (প্রাথমিক)', order: 23 },
    { id: 'cls_ibtedaee_5', name_bn: 'ইবতেদায়ী ৫ম শ্রেণি (ইবতেদায়ী সমাপনী)', name_en: 'Ibtedaee 5', dept: 'ইবতেদায়ী স্তর (প্রাথমিক)', order: 24 },
    { id: 'cls_dakhil_6', name_bn: 'দাখিল ৬ষ্ঠ শ্রেণি', name_en: 'Dakhil 6', dept: 'দাখিল স্তর (মাধ্যমিক)', order: 25 },
    { id: 'cls_dakhil_7', name_bn: 'দাখিল ৭ম শ্রেণি', name_en: 'Dakhil 7', dept: 'দাখিল স্তর (মাধ্যমিক)', order: 26 },
    { id: 'cls_dakhil_8', name_bn: 'দাখিল ৮ম শ্রেণি (জেডিসি)', name_en: 'Dakhil 8 (JDC)', dept: 'দাখিল স্তর (মাধ্যমিক)', order: 27 },
    { id: 'cls_dakhil_9', name_bn: 'দাখিল ৯ম শ্রেণি (সাধারণ ও বিজ্ঞান)', name_en: 'Dakhil 9', dept: 'দাখিল স্তর (মাধ্যমিক)', order: 28 },
    { id: 'cls_dakhil_10', name_bn: 'দাখিল ১০ম শ্রেণি (দাখিল পরীক্ষা)', name_en: 'Dakhil 10 (Exam)', dept: 'দাখিল স্তর (মাধ্যমিক)', order: 29 },
    { id: 'cls_alim_1', name_bn: 'আলিম ১ম বর্ষ (একাদশ শ্রেণি)', name_en: 'Alim 1st Year', dept: 'আলিম স্তর (উচ্চ মাধ্যমিক)', order: 30 },
    { id: 'cls_alim_2', name_bn: 'আলিম ২য় বর্ষ (দ্বাদশ শ্রেণি)', name_en: 'Alim 2nd Year', dept: 'আলিম স্তর (উচ্চ মাধ্যমিক)', order: 31 },
    { id: 'cls_fazil_1', name_bn: 'ফাজিল পাস ১ম বর্ষ', name_en: 'Fazil Pass 1', dept: 'ফাজিল স্তর (স্নাতক/ডিগ্রি)', order: 32 },
    { id: 'cls_fazil_2', name_bn: 'ফাজিল পাস ২য় বর্ষ', name_en: 'Fazil Pass 2', dept: 'ফাজিল স্তর (স্নাতক/ডিগ্রি)', order: 33 },
    { id: 'cls_fazil_3', name_bn: 'ফাজিল পাস ৩য় বর্ষ (স্নাতক ডিগ্রি সমমান)', name_en: 'Fazil Pass 3', dept: 'ফাজিল স্তর (স্নাতক/ডিগ্রি)', order: 34 },
    { id: 'cls_fazil_honours', name_bn: 'ফাজিল অনার্স (৪ বছর মেয়াদী)', name_en: 'Fazil Honours', dept: 'ফাজিল স্তর (স্নাতক/ডিগ্রি)', order: 35 },
    { id: 'cls_kamil_1', name_bn: 'কামিল ১ম পর্ব (হাদিস / তাফসির / ফিকহ / আদব)', name_en: 'Kamil 1st Part', dept: 'কামিল স্তর (স্নাতকোত্তর/মাস্টার্স)', order: 36 },
    { id: 'cls_kamil_2', name_bn: 'কামিল ২য় পর্ব / মাস্টার্স চূড়ান্ত বর্ষ', name_en: 'Kamil 2nd Part (Masters)', dept: 'কামিল স্তর (স্নাতকোত্তর/মাস্টার্স)', order: 37 }
  ];

  for (const c of aliaClasses) {
    await db.run(
      `INSERT OR REPLACE INTO classes (id, tenant_id, branch_id, department, name_bn, name_en, order_index, madrasa_type)
       VALUES (?, 'inst_main', 'branch_mirpur', ?, ?, ?, ?, 'alia')`,
      [c.id, c.dept, c.name_bn, c.name_en, c.order]
    );

    try {
      await db.run(
        `INSERT OR REPLACE INTO class_definitions (id, tenant_id, name_bn, name_en, order_index, department, madrasa_type, created_at, updated_at)
         VALUES (?, 'inst_main', ?, ?, ?, ?, 'alia', datetime('now'), datetime('now'))`,
        [c.id, c.name_bn, c.name_en, c.order, c.dept]
      );
    } catch (e: any) {}
  }

  console.log('Successfully seeded all 18 Alia classes into database!');
}

seed().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
