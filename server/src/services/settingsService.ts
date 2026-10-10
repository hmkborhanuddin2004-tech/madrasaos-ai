import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import {
  InstitutionSettings,
  FeeCategory,
  ClassDefinition,
  SubjectDefinition
} from '../types/index.js';

export class SettingsService {
  /**
   * Helper to ensure a settings row exists for tenant and return it.
   */
  public async ensureSettings(tenantId: string = 'inst_main'): Promise<any> {
    let row = await db.get<any>(
      'SELECT * FROM institution_settings WHERE tenant_id = ? LIMIT 1',
      [tenantId]
    );

    if (!row) {
      // Check if institutions table has existing basic info
      const inst = await db.get<any>(
        'SELECT * FROM institutions WHERE id = ? LIMIT 1',
        [tenantId]
      );

      const now = new Date().toISOString();
      const defaultDesignations = {
        muhtamim: 'মুহতামিম (প্রধান পরিচালক)',
        naib_muhtamim: 'নায়েবে মুহতামিম (উপ-পরিচালক)',
        shaykhul_hadith: 'শায়খুল হাদীস',
        senior_muhaddis: 'সিনিয়র মুহাদ্দিস',
        kitab_teacher: 'কিতাব শিক্ষক (ওস্তাদ)',
        hifz_teacher: 'হাফেজ সাহেব (হিফজ শিক্ষক)',
        nazir_office: 'নাজের / অফিস সহকারী',
        cook_hostel: 'বাবুর্চি / হোস্টেল স্টাফ',
        security: 'নিরাপত্তা কর্মী'
      };

      const defaultDepartments = [
        'হিফজুল কুরআন বিভাগ',
        'কিতাব বিভাগ (দরসে নিজামী)',
        'নূরানী ও নাজেরা বিভাগ',
        'ইফতা ও ফতোয়া বিভাগ',
        'ক্বিরাআত ও তাজবীদ বিভাগ'
      ];

      const defaultLateFee = {
        grace_days: 10,
        amount: 50,
        type: 'fixed',
        description: '১০ তারিখের পর বিলম্ব ফি ৫০ ৳'
      };

      const defaultSecurity = {
        two_factor_auth: false,
        password_expiry_days: 90,
        session_timeout_minutes: 60,
        ip_restriction: false
      };

      const id = `set_${uuidv4().slice(0, 10)}`;
      await db.run(
        `INSERT INTO institution_settings (
          id, tenant_id, name_bn, name_en, logo_url, address, email, phone,
          established_year, madrasa_type, tagline, primary_color, currency_symbol,
          hijri_year_enabled, academic_year_type, sms_sender_id, brevo_api_key,
          whatsapp_enabled, messenger_enabled, email_enabled,
          late_fee_settings_json, designation_labels_json, custom_departments_json, security_settings_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          tenantId,
          inst?.name_bn || 'জামিয়া ইসলামিয়া মডেল মাদ্রাসা',
          inst?.name_en || 'Jamia Islamia Model Madrasa',
          inst?.logo_url || '',
          inst?.address || 'প্লট ১৪, সেকশন ৬, মিরপুর, ঢাকা-১২১৬',
          'info@jamia-islamia.edu.bd',
          inst?.phone || '01711111111',
          1994,
          'Qawmi',
          'ইলম, আমল ও খুলুসিয়্যাতের অনন্য দ্বীনি প্রতিষ্ঠান',
          '#059669',
          '৳',
          1,
          'hijri',
          'MADRASA_OS',
          'xkeysib-demo-seed-test-key-2026',
          1,
          1,
          1,
          JSON.stringify(defaultLateFee),
          JSON.stringify(defaultDesignations),
          JSON.stringify(defaultDepartments),
          JSON.stringify(defaultSecurity),
          now,
          now
        ]
      );

      row = await db.get<any>(
        'SELECT * FROM institution_settings WHERE id = ?',
        [id]
      );
    }

    // Ensure default fee_categories exist for this tenant
    const hasFeeCats = await db.get<any>('SELECT id FROM fee_categories WHERE tenant_id = ? LIMIT 1', [tenantId]);
    if (!hasFeeCats) {
      const defaultCats = [
        { id: `fee_cat_${tenantId}_01`, bn: 'মাসিক বেতন', en: 'Monthly Tuition Fee', amt: 2000, freq: 'monthly', ledger: 'non_residential', desc: 'নিয়মিত মাসিক শিক্ষা ফি' },
        { id: `fee_cat_${tenantId}_02`, bn: 'হোস্টেল ও খাবার ফি', en: 'Hostel & Food Fee', amt: 2500, freq: 'monthly', ledger: 'residential', desc: 'আবাসিক ছাত্রদের থাকা ও খাওয়ার ফি' },
        { id: `fee_cat_${tenantId}_03`, bn: 'বার্ষিক ভর্তি ফি', en: 'Annual Admission Fee', amt: 5000, freq: 'yearly', ledger: 'non_residential', desc: 'নতুন শিক্ষাবর্ষে ভর্তি ও সেশন ফি' },
        { id: `fee_cat_${tenantId}_04`, bn: 'কিতাব ফি', en: 'Kitab & Books Fee', amt: 1500, freq: 'yearly', ledger: 'non_residential', desc: 'বোর্ড নির্ধারিত ও দরসী কিতাবের ফি' },
        { id: `fee_cat_${tenantId}_05`, bn: 'পরীক্ষা ফি', en: 'Exam Fee', amt: 500, freq: 'per_term', ledger: 'non_residential', desc: 'সাময়িক ও বার্ষিক পরীক্ষা ফি' },
        { id: `fee_cat_${tenantId}_06`, bn: 'চিকিৎসা ও কল্যাণ তহবিল', en: 'Medical & Welfare Fund', amt: 200, freq: 'monthly', ledger: 'non_residential', desc: 'ছাত্রদের জরুরি চিকিৎসা ও কল্যাণ তহবিল' }
      ];
      const now = new Date().toISOString();
      for (const fc of defaultCats) {
        await db.run(
          `INSERT INTO fee_categories (id, tenant_id, name_bn, name_en, amount, frequency, ledger_type, description, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [fc.id, tenantId, fc.bn, fc.en, fc.amt, fc.freq, fc.ledger, fc.desc, now, now]
        );
      }
    }

    // Ensure default class_definitions exist for this tenant
    const hasClassDefs = await db.get<any>('SELECT id FROM class_definitions WHERE tenant_id = ? LIMIT 1', [tenantId]);
    if (!hasClassDefs) {
      const defaultClasses = [
        { id: `cls_def_${tenantId}_01`, bn: 'ইবতেদায়ী ১ম বর্ষ (নূরানী)', en: 'Ibtidai 1st Year (Noorani)', ord: 1, dept: 'নূরানী ও নাজেরা বিভাগ' },
        { id: `cls_def_${tenantId}_02`, bn: 'ইবতেদায়ী ২য় বর্ষ (নাজেরা)', en: 'Ibtidai 2nd Year (Nazera)', ord: 2, dept: 'নূরানী ও নাজেরা বিভাগ' },
        { id: `cls_def_${tenantId}_03`, bn: 'হিফজুল কুরআন জামাত', en: 'Hifzul Quran', ord: 3, dept: 'হিফজুল কুরআন বিভাগ' },
        { id: `cls_def_${tenantId}_04`, bn: 'মুতাওয়াচ্ছিতাহ (নাহবেমীর)', en: 'Mutawassitah (Nahbemir)', ord: 4, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
        { id: `cls_def_${tenantId}_05`, bn: 'মুতাওয়াচ্ছিতাহ (হেদায়াতুন্নাহু)', en: 'Mutawassitah (Hidayatun Nahw)', ord: 5, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
        { id: `cls_def_${tenantId}_06`, bn: 'সানাভিয়্যাহ আম্মাহ (কাফিয়া)', en: 'Sanaviyyah Ammah (Kafiya)', ord: 6, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
        { id: `cls_def_${tenantId}_07`, bn: 'সানাভিয়্যাহ খাচ্ছাহ (শারহে বেকায়া)', en: 'Sanaviyyah Khassah (Sharh Wiqayah)', ord: 7, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
        { id: `cls_def_${tenantId}_08`, bn: 'ফযীলত (জালালাইন ও মিশকাত)', en: 'Fadeelat (Mishkat)', ord: 8, dept: 'কিতাব বিভাগ (দরসে নিজামী)' },
        { id: `cls_def_${tenantId}_09`, bn: 'তাকমীল / দাওরায়ে হাদীস', en: 'Takmeel / Dawra-e-Hadith', ord: 9, dept: 'কিতাব বিভাগ (দরসে নিজামী)' }
      ];
      const now = new Date().toISOString();
      for (const cd of defaultClasses) {
        await db.run(
          `INSERT INTO class_definitions (id, tenant_id, name_bn, name_en, order_index, department, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [cd.id, tenantId, cd.bn, cd.en, cd.ord, cd.dept, now, now]
        );
      }
    }

    // Ensure default subject_definitions exist for this tenant
    const hasSubjDefs = await db.get<any>('SELECT id FROM subject_definitions WHERE tenant_id = ? LIMIT 1', [tenantId]);
    if (!hasSubjDefs) {
      const defaultSubjects = [
        { id: `subj_def_${tenantId}_01`, bn: 'পবিত্র কুরআন তিলাওয়াত ও তাজবীদ', en: 'Quran Recitation & Tajweed', code: 'QUR-101', total: 100, pass: 40 },
        { id: `subj_def_${tenantId}_02`, bn: 'আল-কাফিয়া (আরবি ব্যাকরণ / নাহব)', en: 'Al-Kafiya (Arabic Syntax)', code: 'ARB-201', total: 100, pass: 33 },
        { id: `subj_def_${tenantId}_03`, bn: 'উসূলুশ শাশী (ইসলামিক আইনশাস্ত্র / উসূলে ফিক্বহ)', en: 'Usul al-Shashi (Principles of Fiqh)', code: 'FIQ-301', total: 100, pass: 33 },
        { id: `subj_def_${tenantId}_04`, bn: 'মুখতাসারুল কুদূরী (ফিক্বহ ও মুয়ামালাত)', en: 'Mukhtasar al-Quduri (Islamic Jurisprudence)', code: 'FIQ-302', total: 100, pass: 33 },
        { id: `subj_def_${tenantId}_05`, bn: 'নূরুল ঈযাহ ও সীরাত', en: 'Nur al-Idah & Seerat', code: 'ISL-201', total: 100, pass: 33 },
        { id: `subj_def_${tenantId}_06`, bn: 'মিশকাতুল মাসাবীহ (হাদীস সংকলন)', en: 'Mishkat al-Masabih (Hadith Anthology)', code: 'HAD-401', total: 100, pass: 40 },
        { id: `subj_def_${tenantId}_07`, bn: 'বাংলা ভাষা ও সাহিত্য', en: 'Bengali Literature', code: 'BAN-101', total: 100, pass: 33 },
        { id: `subj_def_${tenantId}_08`, bn: 'গণিত ও হিসাব বিজ্ঞান', en: 'Mathematics & Accounts', code: 'MAT-101', total: 100, pass: 33 },
        { id: `subj_def_${tenantId}_09`, bn: 'ইংরেজি ভাষা ও ব্যাকরণ', en: 'English Language', code: 'ENG-101', total: 100, pass: 33 }
      ];
      const now = new Date().toISOString();
      for (const sd of defaultSubjects) {
        await db.run(
          `INSERT INTO subject_definitions (id, tenant_id, name_bn, name_en, code, total_marks, pass_marks, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [sd.id, tenantId, sd.bn, sd.en, sd.code, sd.total, sd.pass, now, now]
        );
      }
    }

    return row;
  }

  private mapSettingsRow(row: any): InstitutionSettings {
    let lateFeeSettings = {
      grace_days: 10,
      amount: 50,
      type: 'fixed' as const,
      description: '১০ তারিখের পর বিলম্ব ফি'
    };
    try {
      if (row.late_fee_settings_json) {
        lateFeeSettings = { ...lateFeeSettings, ...JSON.parse(row.late_fee_settings_json) };
      }
    } catch {}

    let designationLabels: Record<string, string> = {};
    try {
      if (row.designation_labels_json) {
        designationLabels = JSON.parse(row.designation_labels_json);
      }
    } catch {}

    let customDepartments: string[] = [];
    try {
      if (row.custom_departments_json) {
        customDepartments = JSON.parse(row.custom_departments_json);
      }
    } catch {}

    let securitySettings: any = {};
    try {
      if (row.security_settings_json) {
        securitySettings = JSON.parse(row.security_settings_json);
      }
    } catch {}

    return {
      id: row.id,
      tenantId: row.tenant_id,
      nameBn: row.name_bn,
      nameEn: row.name_en,
      principalName: row.principal_name || 'মাওলানা মাহমুদুল হাসান',
      logoUrl: row.logo_url || '',
      address: row.address || '',
      email: row.email || '',
      phone: row.phone || '',
      establishedYear: row.established_year ? Number(row.established_year) : undefined,
      madrasaType: row.madrasa_type || 'Qawmi',
      tagline: row.tagline || '',
      primaryColor: row.primary_color || '#059669',
      currencySymbol: row.currency_symbol || '৳',
      hijriYearEnabled: Boolean(row.hijri_year_enabled),
      academicYearType: row.academic_year_type || 'hijri',
      smsSenderId: row.sms_sender_id || '',
      brevoApiKey: row.brevo_api_key || '',
      geminiApiKey: row.gemini_api_key || '',
      whatsappEnabled: Boolean(row.whatsapp_enabled),
      messengerEnabled: Boolean(row.messenger_enabled),
      emailEnabled: Boolean(row.email_enabled),
      lateFeeSettings,
      designationLabels,
      customDepartments,
      securitySettings,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Get full institution settings and definitions for tenant
   */
  public async getSettings(tenantId: string = 'inst_main'): Promise<{
    settings: InstitutionSettings;
    feeCategories: FeeCategory[];
    classDefinitions: ClassDefinition[];
    subjectDefinitions: SubjectDefinition[];
  }> {
    const row = await this.ensureSettings(tenantId);
    const settings = this.mapSettingsRow(row);

    const feeCategories = await this.listFeeCategories(tenantId);
    const classDefinitions = await this.listClassDefinitions(tenantId);
    const subjectDefinitions = await this.listSubjectDefinitions(tenantId);

    return {
      settings,
      feeCategories,
      classDefinitions,
      subjectDefinitions
    };
  }

  /**
   * Public branding / configuration
   */
  public async getPublicSettings(tenantId: string = 'inst_main'): Promise<any> {
    const row = await this.ensureSettings(tenantId);
    const settings = this.mapSettingsRow(row);

    return {
      tenantId: settings.tenantId,
      nameBn: settings.nameBn,
      nameEn: settings.nameEn,
      principalName: settings.principalName,
      logoUrl: settings.logoUrl,
      tagline: settings.tagline,
      primaryColor: settings.primaryColor,
      currencySymbol: settings.currencySymbol,
      madrasaType: settings.madrasaType,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      establishedYear: settings.establishedYear,
      academicYearType: settings.academicYearType,
      hijriYearEnabled: settings.hijriYearEnabled,
      designationLabels: settings.designationLabels,
      customDepartments: settings.customDepartments
    };
  }

  /**
   * Update institution settings
   */
  public async updateSettings(tenantId: string = 'inst_main', updates: any): Promise<InstitutionSettings> {
    const current = await this.ensureSettings(tenantId);
    const now = new Date().toISOString();

    const nameBn = updates.nameBn !== undefined ? updates.nameBn : (updates.name_bn !== undefined ? updates.name_bn : current.name_bn);
    const nameEn = updates.nameEn !== undefined ? updates.nameEn : (updates.name_en !== undefined ? updates.name_en : current.name_en);
    const principalName = updates.principalName !== undefined ? updates.principalName : (updates.principal_name !== undefined ? updates.principal_name : (current.principal_name || 'মাওলানা মাহমুদুল হাসান'));
    const logoUrl = updates.logoUrl !== undefined ? updates.logoUrl : (updates.logo_url !== undefined ? updates.logo_url : current.logo_url);
    const address = updates.address !== undefined ? updates.address : current.address;
    const email = updates.email !== undefined ? updates.email : current.email;
    const phone = updates.phone !== undefined ? updates.phone : current.phone;
    const establishedYear = updates.establishedYear !== undefined ? Number(updates.establishedYear) : (updates.established_year !== undefined ? Number(updates.established_year) : current.established_year);
    const madrasaType = updates.madrasaType !== undefined ? updates.madrasaType : (updates.madrasa_type !== undefined ? updates.madrasa_type : current.madrasa_type);
    const tagline = updates.tagline !== undefined ? updates.tagline : current.tagline;
    const primaryColor = updates.primaryColor !== undefined ? updates.primaryColor : (updates.primary_color !== undefined ? updates.primary_color : current.primary_color);
    const currencySymbol = updates.currencySymbol !== undefined ? updates.currencySymbol : (updates.currency_symbol !== undefined ? updates.currency_symbol : current.currency_symbol);
    const hijriYearEnabled = updates.hijriYearEnabled !== undefined ? (updates.hijriYearEnabled ? 1 : 0) : (updates.hijri_year_enabled !== undefined ? (updates.hijri_year_enabled ? 1 : 0) : current.hijri_year_enabled);
    const academicYearType = updates.academicYearType !== undefined ? updates.academicYearType : (updates.academic_year_type !== undefined ? updates.academic_year_type : current.academic_year_type);
    const smsSenderId = updates.smsSenderId !== undefined ? updates.smsSenderId : (updates.sms_sender_id !== undefined ? updates.sms_sender_id : current.sms_sender_id);
    const brevoApiKey = updates.brevoApiKey !== undefined ? updates.brevoApiKey : (updates.brevo_api_key !== undefined ? updates.brevo_api_key : current.brevo_api_key);
    const geminiApiKey = updates.geminiApiKey !== undefined ? updates.geminiApiKey : (updates.gemini_api_key !== undefined ? updates.gemini_api_key : current.gemini_api_key);
    const whatsappEnabled = updates.whatsappEnabled !== undefined ? (updates.whatsappEnabled ? 1 : 0) : (updates.whatsapp_enabled !== undefined ? (updates.whatsapp_enabled ? 1 : 0) : current.whatsapp_enabled);
    const messengerEnabled = updates.messengerEnabled !== undefined ? (updates.messengerEnabled ? 1 : 0) : (updates.messenger_enabled !== undefined ? (updates.messenger_enabled ? 1 : 0) : current.messenger_enabled);
    const emailEnabled = updates.emailEnabled !== undefined ? (updates.emailEnabled ? 1 : 0) : (updates.email_enabled !== undefined ? (updates.email_enabled ? 1 : 0) : current.email_enabled);

    let lateFeeJson = current.late_fee_settings_json;
    if (updates.lateFeeSettings !== undefined) {
      lateFeeJson = JSON.stringify(updates.lateFeeSettings);
    } else if (updates.late_fee_settings !== undefined) {
      lateFeeJson = JSON.stringify(updates.late_fee_settings);
    }

    let designationLabelsJson = current.designation_labels_json;
    if (updates.designationLabels !== undefined) {
      designationLabelsJson = JSON.stringify(updates.designationLabels);
    } else if (updates.designation_labels !== undefined) {
      designationLabelsJson = JSON.stringify(updates.designation_labels);
    }

    let customDepartmentsJson = current.custom_departments_json;
    if (updates.customDepartments !== undefined) {
      customDepartmentsJson = JSON.stringify(updates.customDepartments);
    } else if (updates.custom_departments !== undefined) {
      customDepartmentsJson = JSON.stringify(updates.custom_departments);
    }

    let securitySettingsJson = current.security_settings_json;
    if (updates.securitySettings !== undefined) {
      securitySettingsJson = JSON.stringify(updates.securitySettings);
    } else if (updates.security_settings !== undefined) {
      securitySettingsJson = JSON.stringify(updates.security_settings);
    }

    await db.run(
      `UPDATE institution_settings
       SET name_bn = ?, name_en = ?, principal_name = ?, logo_url = ?, address = ?, email = ?, phone = ?,
           established_year = ?, madrasa_type = ?, tagline = ?, primary_color = ?, currency_symbol = ?,
           hijri_year_enabled = ?, academic_year_type = ?, sms_sender_id = ?, brevo_api_key = ?, gemini_api_key = ?,
           whatsapp_enabled = ?, messenger_enabled = ?, email_enabled = ?,
           late_fee_settings_json = ?, designation_labels_json = ?, custom_departments_json = ?, security_settings_json = ?,
           updated_at = ?
       WHERE tenant_id = ?`,
      [
        nameBn,
        nameEn,
        principalName,
        logoUrl,
        address,
        email,
        phone,
        establishedYear,
        madrasaType,
        tagline,
        primaryColor,
        currencySymbol,
        hijriYearEnabled,
        academicYearType,
        smsSenderId,
        brevoApiKey,
        geminiApiKey,
        whatsappEnabled,
        messengerEnabled,
        emailEnabled,
        lateFeeJson,
        designationLabelsJson,
        customDepartmentsJson,
        securitySettingsJson,
        now,
        tenantId
      ]
    );

    // Keep institutions table synchronized
    try {
      await db.run(
        `UPDATE institutions
         SET name_bn = ?, name_en = ?, address = ?, phone = ?, logo_url = ?
         WHERE id = ?`,
        [nameBn, nameEn, address, phone, logoUrl, tenantId]
      );
    } catch {}

    // Support bulk feeCategories, classDefinitions, subjectDefinitions sync if passed
    if (Array.isArray(updates.feeCategories)) {
      for (const fc of updates.feeCategories) {
        if (fc.id) {
          const exists = await db.get('SELECT id FROM fee_categories WHERE id = ?', [fc.id]);
          if (exists) {
            await this.updateFeeCategory(tenantId, fc.id, fc);
          } else {
            await this.createFeeCategory(tenantId, fc);
          }
        } else {
          await this.createFeeCategory(tenantId, fc);
        }
      }
    }

    if (Array.isArray(updates.classDefinitions)) {
      for (const cd of updates.classDefinitions) {
        if (cd.id) {
          const exists = await db.get('SELECT id FROM class_definitions WHERE id = ?', [cd.id]);
          if (exists) {
            await this.updateClassDefinition(tenantId, cd.id, cd);
          } else {
            await this.createClassDefinition(tenantId, cd);
          }
        } else {
          await this.createClassDefinition(tenantId, cd);
        }
      }
    }

    if (Array.isArray(updates.subjectDefinitions)) {
      for (const sd of updates.subjectDefinitions) {
        if (sd.id) {
          const exists = await db.get('SELECT id FROM subject_definitions WHERE id = ?', [sd.id]);
          if (exists) {
            await this.updateSubjectDefinition(tenantId, sd.id, sd);
          } else {
            await this.createSubjectDefinition(tenantId, sd);
          }
        } else {
          await this.createSubjectDefinition(tenantId, sd);
        }
      }
    }

    const updatedRow = await db.get<any>(
      'SELECT * FROM institution_settings WHERE tenant_id = ?',
      [tenantId]
    );
    return this.mapSettingsRow(updatedRow);
  }

  // ==================== Fee Categories CRUD ====================

  public async listFeeCategories(tenantId: string = 'inst_main'): Promise<FeeCategory[]> {
    const rows = await db.all<any>(
      `SELECT * FROM fee_categories
       WHERE tenant_id = ?
       ORDER BY created_at ASC`,
      [tenantId]
    );

    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      nameBn: r.name_bn,
      nameEn: r.name_en,
      amount: Number(r.amount) || 0,
      frequency: r.frequency || 'monthly',
      ledgerType: (r.ledger_type || 'non_residential') as 'residential' | 'non_residential',
      description: r.description || '',
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  public async createFeeCategory(tenantId: string = 'inst_main', data: any): Promise<FeeCategory> {
    const nameBn = data.nameBn || data.name_bn;
    const nameEn = data.nameEn || data.name_en || nameBn;
    if (!nameBn) {
      throw new Error('ক্যাটাগরির নাম (বাংলা) আবশ্যক।');
    }

    const id = data.id || `fee_cat_${uuidv4().slice(0, 8)}`;
    const amount = Number(data.amount) || 0;
    const frequency = data.frequency || 'monthly';
    const ledgerType = data.ledgerType || data.ledger_type || 'non_residential';
    const description = data.description || '';
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : (data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1);
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO fee_categories (id, tenant_id, name_bn, name_en, amount, frequency, ledger_type, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, nameBn, nameEn, amount, frequency, ledgerType, description, isActive, now, now]
    );

    const created = await db.get<any>('SELECT * FROM fee_categories WHERE id = ?', [id]);
    return {
      id: created.id,
      tenantId: created.tenant_id,
      nameBn: created.name_bn,
      nameEn: created.name_en,
      amount: Number(created.amount) || 0,
      frequency: created.frequency,
      ledgerType: (created.ledger_type || 'non_residential') as 'residential' | 'non_residential',
      description: created.description || '',
      isActive: Boolean(created.is_active),
      createdAt: created.created_at,
      updatedAt: created.updated_at
    };
  }

  public async updateFeeCategory(tenantId: string = 'inst_main', id: string, data: any): Promise<FeeCategory> {
    const existing = await db.get<any>(
      'SELECT * FROM fee_categories WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (!existing) {
      throw new Error('ফি ক্যাটাগরি পাওয়া যায়নি।');
    }

    const nameBn = data.nameBn !== undefined ? data.nameBn : (data.name_bn !== undefined ? data.name_bn : existing.name_bn);
    const nameEn = data.nameEn !== undefined ? data.nameEn : (data.name_en !== undefined ? data.name_en : existing.name_en);
    const amount = data.amount !== undefined ? Number(data.amount) : existing.amount;
    const frequency = data.frequency !== undefined ? data.frequency : existing.frequency;
    const ledgerType = data.ledgerType !== undefined ? data.ledgerType : (data.ledger_type !== undefined ? data.ledger_type : existing.ledger_type || 'non_residential');
    const description = data.description !== undefined ? data.description : existing.description;
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : (data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active);
    const now = new Date().toISOString();

    await db.run(
      `UPDATE fee_categories
       SET name_bn = ?, name_en = ?, amount = ?, frequency = ?, ledger_type = ?, description = ?, is_active = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [nameBn, nameEn, amount, frequency, ledgerType, description, isActive, now, id, tenantId]
    );

    const updated = await db.get<any>('SELECT * FROM fee_categories WHERE id = ?', [id]);
    return {
      id: updated.id,
      tenantId: updated.tenant_id,
      nameBn: updated.name_bn,
      nameEn: updated.name_en,
      amount: Number(updated.amount) || 0,
      frequency: updated.frequency,
      ledgerType: (updated.ledger_type || 'non_residential') as 'residential' | 'non_residential',
      description: updated.description || '',
      isActive: Boolean(updated.is_active),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };
  }

  public async deleteFeeCategory(tenantId: string = 'inst_main', id: string): Promise<boolean> {
    const result = await db.run(
      'DELETE FROM fee_categories WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    return result.changes > 0;
  }

  // ==================== Class Definitions CRUD ====================

  public async listClassDefinitions(tenantId: string = 'inst_main'): Promise<ClassDefinition[]> {
    const rows = await db.all<any>(
      `SELECT * FROM class_definitions
       WHERE tenant_id = ?
       ORDER BY order_index ASC`,
      [tenantId]
    );

    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      nameBn: r.name_bn,
      nameEn: r.name_en,
      orderIndex: Number(r.order_index) || 0,
      department: r.department || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  public async createClassDefinition(tenantId: string = 'inst_main', data: any): Promise<ClassDefinition> {
    const nameBn = data.nameBn || data.name_bn;
    const nameEn = data.nameEn || data.name_en || nameBn;
    if (!nameBn) {
      throw new Error('ক্লাসের নাম (বাংলা) আবশ্যক।');
    }

    const id = data.id || `cls_def_${uuidv4().slice(0, 8)}`;
    const orderIndex = Number(data.orderIndex !== undefined ? data.orderIndex : data.order_index) || 0;
    const department = data.department || 'কওমী বিভাগ';
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO class_definitions (id, tenant_id, name_bn, name_en, order_index, department, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, nameBn, nameEn, orderIndex, department, now, now]
    );

    // Keep classes table synchronized
    try {
      const existingClass = await db.get('SELECT id FROM classes WHERE id = ?', [id]);
      if (!existingClass) {
        await db.run(
          `INSERT INTO classes (id, tenant_id, branch_id, department, name_bn, name_en, order_index)
           VALUES (?, ?, 'branch_mirpur', ?, ?, ?, ?)`,
          [id, tenantId, department, nameBn, nameEn, orderIndex]
        );
      }
    } catch {}

    const created = await db.get<any>('SELECT * FROM class_definitions WHERE id = ?', [id]);
    return {
      id: created.id,
      tenantId: created.tenant_id,
      nameBn: created.name_bn,
      nameEn: created.name_en,
      orderIndex: Number(created.order_index) || 0,
      department: created.department,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    };
  }

  public async updateClassDefinition(tenantId: string = 'inst_main', id: string, data: any): Promise<ClassDefinition> {
    const existing = await db.get<any>(
      'SELECT * FROM class_definitions WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (!existing) {
      throw new Error('ক্লাস ডেফিনিশন পাওয়া যায়নি।');
    }

    const nameBn = data.nameBn !== undefined ? data.nameBn : (data.name_bn !== undefined ? data.name_bn : existing.name_bn);
    const nameEn = data.nameEn !== undefined ? data.nameEn : (data.name_en !== undefined ? data.name_en : existing.name_en);
    const orderIndex = data.orderIndex !== undefined ? Number(data.orderIndex) : (data.order_index !== undefined ? Number(data.order_index) : existing.order_index);
    const department = data.department !== undefined ? data.department : existing.department;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE class_definitions
       SET name_bn = ?, name_en = ?, order_index = ?, department = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [nameBn, nameEn, orderIndex, department, now, id, tenantId]
    );

    // Keep classes table synchronized
    try {
      await db.run(
        `UPDATE classes
         SET name_bn = ?, name_en = ?, order_index = ?, department = ?
         WHERE id = ? AND tenant_id = ?`,
        [nameBn, nameEn, orderIndex, department, id, tenantId]
      );
    } catch {}

    const updated = await db.get<any>('SELECT * FROM class_definitions WHERE id = ?', [id]);
    return {
      id: updated.id,
      tenantId: updated.tenant_id,
      nameBn: updated.name_bn,
      nameEn: updated.name_en,
      orderIndex: Number(updated.order_index) || 0,
      department: updated.department,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };
  }

  public async deleteClassDefinition(tenantId: string = 'inst_main', id: string): Promise<boolean> {
    const result = await db.run(
      'DELETE FROM class_definitions WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    try {
      await db.run('DELETE FROM classes WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    } catch {}
    return result.changes > 0;
  }

  // ==================== Subject Definitions CRUD ====================

  public async listSubjectDefinitions(tenantId: string = 'inst_main'): Promise<SubjectDefinition[]> {
    const rows = await db.all<any>(
      `SELECT * FROM subject_definitions
       WHERE tenant_id = ?
       ORDER BY created_at ASC`,
      [tenantId]
    );

    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      classId: r.class_id || undefined,
      nameBn: r.name_bn,
      nameEn: r.name_en,
      code: r.code || undefined,
      totalMarks: Number(r.total_marks) || 100,
      passMarks: Number(r.pass_marks) || 33,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  public async createSubjectDefinition(tenantId: string = 'inst_main', data: any): Promise<SubjectDefinition> {
    const nameBn = data.nameBn || data.name_bn;
    const nameEn = data.nameEn || data.name_en || nameBn;
    if (!nameBn) {
      throw new Error('বিষয়ের নাম (বাংলা) আবশ্যক।');
    }

    const id = data.id || `subj_def_${uuidv4().slice(0, 8)}`;
    const classId = data.classId || data.class_id || null;
    const code = data.code || null;
    const totalMarks = Number(data.totalMarks !== undefined ? data.totalMarks : data.total_marks) || 100;
    const passMarks = Number(data.passMarks !== undefined ? data.passMarks : data.pass_marks) || 33;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO subject_definitions (id, tenant_id, class_id, name_bn, name_en, code, total_marks, pass_marks, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, classId, nameBn, nameEn, code, totalMarks, passMarks, now, now]
    );

    const created = await db.get<any>('SELECT * FROM subject_definitions WHERE id = ?', [id]);
    return {
      id: created.id,
      tenantId: created.tenant_id,
      classId: created.class_id || undefined,
      nameBn: created.name_bn,
      nameEn: created.name_en,
      code: created.code || undefined,
      totalMarks: Number(created.total_marks) || 100,
      passMarks: Number(created.pass_marks) || 33,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    };
  }

  public async updateSubjectDefinition(tenantId: string = 'inst_main', id: string, data: any): Promise<SubjectDefinition> {
    const existing = await db.get<any>(
      'SELECT * FROM subject_definitions WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (!existing) {
      throw new Error('বিষয় পাওয়া যায়নি।');
    }

    const nameBn = data.nameBn !== undefined ? data.nameBn : (data.name_bn !== undefined ? data.name_bn : existing.name_bn);
    const nameEn = data.nameEn !== undefined ? data.nameEn : (data.name_en !== undefined ? data.name_en : existing.name_en);
    const classId = data.classId !== undefined ? data.classId : (data.class_id !== undefined ? data.class_id : existing.class_id);
    const code = data.code !== undefined ? data.code : existing.code;
    const totalMarks = data.totalMarks !== undefined ? Number(data.totalMarks) : (data.total_marks !== undefined ? Number(data.total_marks) : existing.total_marks);
    const passMarks = data.passMarks !== undefined ? Number(data.passMarks) : (data.pass_marks !== undefined ? Number(data.pass_marks) : existing.pass_marks);
    const now = new Date().toISOString();

    await db.run(
      `UPDATE subject_definitions
       SET class_id = ?, name_bn = ?, name_en = ?, code = ?, total_marks = ?, pass_marks = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [classId, nameBn, nameEn, code, totalMarks, passMarks, now, id, tenantId]
    );

    const updated = await db.get<any>('SELECT * FROM subject_definitions WHERE id = ?', [id]);
    return {
      id: updated.id,
      tenantId: updated.tenant_id,
      classId: updated.class_id || undefined,
      nameBn: updated.name_bn,
      nameEn: updated.name_en,
      code: updated.code || undefined,
      totalMarks: Number(updated.total_marks) || 100,
      passMarks: Number(updated.pass_marks) || 33,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };
  }

  public async deleteSubjectDefinition(tenantId: string = 'inst_main', id: string): Promise<boolean> {
    const result = await db.run(
      'DELETE FROM subject_definitions WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    return result.changes > 0;
  }

  // ==================== Department & Designation Helpers ====================

  public async getDepartments(tenantId: string = 'inst_main'): Promise<string[]> {
    const row = await this.ensureSettings(tenantId);
    try {
      return JSON.parse(row.custom_departments_json || '[]');
    } catch {
      return [];
    }
  }

  public async addDepartment(tenantId: string = 'inst_main', name: string): Promise<string[]> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('বিভাগের নাম আবশ্যক।');
    const departments = await this.getDepartments(tenantId);
    if (!departments.includes(trimmed)) {
      departments.push(trimmed);
      await this.updateSettings(tenantId, { customDepartments: departments });
    }
    return departments;
  }

  public async deleteDepartment(tenantId: string = 'inst_main', name: string): Promise<string[]> {
    let departments = await this.getDepartments(tenantId);
    departments = departments.filter((d) => d !== name.trim());
    await this.updateSettings(tenantId, { customDepartments: departments });
    return departments;
  }

  public async getDesignations(tenantId: string = 'inst_main'): Promise<Record<string, string>> {
    const row = await this.ensureSettings(tenantId);
    try {
      return JSON.parse(row.designation_labels_json || '{}');
    } catch {
      return {};
    }
  }

  public async updateDesignations(tenantId: string = 'inst_main', labels: Record<string, string>): Promise<Record<string, string>> {
    const current = await this.getDesignations(tenantId);
    const merged = { ...current, ...labels };
    await this.updateSettings(tenantId, { designationLabels: merged });
    return merged;
  }

  public async getHifzAlertSettings(tenantId: string = 'inst_main'): Promise<any> {
    const row = await this.ensureSettings(tenantId);
    try {
      if (row.hifz_alert_settings_json) {
        return JSON.parse(row.hifz_alert_settings_json);
      }
    } catch {}
    return {
      weakRatingThreshold: 2,
      maxSabkiMistakes: 3,
      maxAmukhtaMistakes: 4,
      maxDourMistakes: 5,
      alertOnConsecutiveDays: 3,
      notifyGuardianOnWeak: true,
      notifyMuhtamimOnTrend: true
    };
  }

  public async updateHifzAlertSettings(tenantId: string = 'inst_main', alertSettings: any): Promise<any> {
    const current = await this.getHifzAlertSettings(tenantId);
    const updated = { ...current, ...alertSettings };
    await db.run(
      'UPDATE institution_settings SET hifz_alert_settings_json = ?, updated_at = ? WHERE tenant_id = ?',
      [JSON.stringify(updated), new Date().toISOString(), tenantId]
    );
    return updated;
  }

  public async getSemesterSettings(tenantId: string = 'inst_main'): Promise<any> {
    const row = await this.ensureSettings(tenantId);
    try {
      if (row.semester_settings_json) {
        return JSON.parse(row.semester_settings_json);
      }
    } catch {}
    return {
      system: 'qawmi_3_term',
      terms: [
        { id: 'term_1', nameBn: 'প্রথম সাময়িক (ছয়মাহী)', nameEn: 'First Term (6-Month)', order: 1, weightage: 30 },
        { id: 'term_2', nameBn: 'দ্বিতীয় সাময়িক (নভমাহী)', nameEn: 'Second Term (9-Month)', order: 2, weightage: 30 },
        { id: 'term_3', nameBn: 'বার্ষিক পরীক্ষা (সালানা)', nameEn: 'Annual Examination (Salana)', order: 3, weightage: 40 }
      ]
    };
  }

  public async updateSemesterSettings(tenantId: string = 'inst_main', semesterSettings: any): Promise<any> {
    const current = await this.getSemesterSettings(tenantId);
    const updated = { ...current, ...semesterSettings };
    await db.run(
      'UPDATE institution_settings SET semester_settings_json = ?, updated_at = ? WHERE tenant_id = ?',
      [JSON.stringify(updated), new Date().toISOString(), tenantId]
    );
    return updated;
  }
}

export const settingsService = new SettingsService();
