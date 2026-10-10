import { randomUUID } from 'crypto';
import { AutomationContext } from './context.js';
import { AutomationModule } from './result.js';

export const resultProcess: AutomationModule = {
  key: 'result_process',
  name: 'Result Processing',
  cron: '', // Manual only usually
  priority: 50,
  run: async (ctx: AutomationContext, params: any) => {
    if (!params || !params.exam_id) throw new Error('exam_id required');
    const exam_id = params.exam_id;

    const exam = await ctx.db.get('SELECT * FROM exams WHERE id = ?', [exam_id]);
    if (!exam) throw new Error('Exam not found');

    const policy = await ctx.db.get('SELECT * FROM grading_policies WHERE is_active = 1 AND effective_from <= ? ORDER BY effective_from DESC LIMIT 1', [exam.start_date]);
    if (!policy) throw new Error('No active grading policy found');

    const gradeTable = JSON.parse(policy.grade_table);
    
    // get subjects
    const subjects = await ctx.db.all('SELECT * FROM subjects WHERE class_id = ?', [exam.class_id]);
    const minMarksMap = new Map();
    const coreMap = new Map();
    subjects.forEach((s: any) => {
      minMarksMap.set(s.id, s.pass_marks);
      coreMap.set(s.id, s.is_core);
    });

    const marks = await ctx.db.all('SELECT * FROM marks WHERE exam_id = ?', [exam_id]);
    const studentsMap = new Map<string, any[]>();
    marks.forEach((m: any) => {
      if (!studentsMap.has(m.student_id)) studentsMap.set(m.student_id, []);
      studentsMap.get(m.student_id)!.push(m);
    });

    const results = [];
    
    for (const [student_id, studentMarks] of studentsMap.entries()) {
      let total = 0;
      let totalMax = subjects.reduce((sum: number, s: any) => sum + s.full_marks, 0); // Assuming full_marks exists, defaulting to 100 per subject for totalMax if not
      
      let allPass = true;
      let passedCount = 0;
      let corePassed = true;

      for (const sm of studentMarks) {
        total += sm.obtained_marks;
        const passMark = minMarksMap.get(sm.subject_id) || 33;
        const isPass = sm.obtained_marks >= passMark;
        if (!isPass) allPass = false;
        if (isPass) passedCount++;
        if (coreMap.get(sm.subject_id) && !isPass) corePassed = false;
      }

      // calculate percent based on actually evaluated subjects
      let totalFull = studentMarks.length * 100; // simple assumption: each subject 100 marks full
      let percent = totalFull > 0 ? (total / totalFull) * 100 : 0;
      
      let isPassOverall = false;
      if (policy.pass_rule === 'strict') isPassOverall = allPass;
      else if (policy.pass_rule === 'lenient') isPassOverall = percent >= policy.overall_pass_percent;
      else if (policy.pass_rule === 'x_of_y') isPassOverall = passedCount >= policy.min_subjects_to_pass;
      else if (policy.pass_rule === 'hybrid') isPassOverall = corePassed && (percent >= policy.overall_pass_percent);

      let grade = 'F';
      let gpa = 0;

      if (isPassOverall) {
        // Find grade
        const matched = gradeTable.find((g: any) => percent >= g.min_percent);
        if (matched) {
          grade = matched.grade;
          gpa = matched.gpa;
        } else if (gradeTable.length > 0) {
           grade = gradeTable[gradeTable.length - 1].grade; // lowest passing
           gpa = gradeTable[gradeTable.length - 1].gpa;
        }
      }

      results.push({
        student_id,
        total_marks: total,
        gpa,
        grade,
        is_pass: isPassOverall ? 1 : 0
      } as any);
    }

    // sort
    if (policy.merit_by === 'gpa') {
      results.sort((a, b) => b.gpa - a.gpa || b.total_marks - a.total_marks);
    } else {
      results.sort((a, b) => b.total_marks - a.total_marks || b.gpa - a.gpa);
    }

    // apply rank
    let rank = 1;
    for (let i = 0; i < results.length; i++) {
      if (i > 0 && results[i].total_marks === results[i-1].total_marks && results[i].gpa === results[i-1].gpa) {
        results[i].rank = results[i-1].rank; // tie
      } else {
        results[i].rank = rank;
      }
      rank++;
    }

    let created = 0, updated = 0;
    for (const r of results) {
      const existing = await ctx.db.get('SELECT id, is_locked FROM results WHERE exam_id = ? AND student_id = ?', [exam_id, r.student_id]);
      if (existing) {
        if (existing.is_locked === 1) continue;
        await ctx.db.run(
          'UPDATE results SET total_marks = ?, gpa = ?, grade = ?, merit_position = ?, updated_at = ? WHERE id = ?',
          [r.total_marks, r.gpa, r.grade, r.rank, ctx.now().toISOString(), existing.id]
        );
        updated++;
      } else {
        const id = randomUUID();
        await ctx.db.run(
          'INSERT INTO results (id, exam_id, student_id, total_marks, gpa, grade, merit_position, is_pass) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, exam_id, r.student_id, r.total_marks, r.gpa, r.grade, r.rank, r.is_pass]
        );
        created++;
      }
    }

    return { processed: studentsMap.size, created, updated };
  }
};
