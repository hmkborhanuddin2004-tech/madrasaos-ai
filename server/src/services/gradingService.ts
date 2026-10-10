

export async function calculateResult(examId: string, studentId: string, policy: any, db: any) {
  const marks = await db.all(
    `SELECT * FROM exam_marks WHERE exam_id = ? AND student_id = ?`,
    [examId, studentId]
  );

  if (!marks || marks.length === 0) {
    throw new Error("No marks found for student in exam");
  }

  let totalMarks = 0;
  let obtainedMarks = 0;
  let passedSubjects = 0;
  let totalSubjects = marks.length;
  let coreFailed = false;

  const coreSubjects = policy.core_subjects ? JSON.parse(policy.core_subjects) : [];
  const subjectPassMarks = policy.subject_pass_marks ? JSON.parse(policy.subject_pass_marks) : {};
  const gradeTable = policy.grade_table ? JSON.parse(policy.grade_table) : [];

  for (const mark of marks) {
    totalMarks += mark.total_marks;
    obtainedMarks += mark.obtained_marks;

    const passMark = subjectPassMarks[mark.subject_name_bn] || policy.default_pass_marks || 40;
    const isPassed = mark.obtained_marks >= passMark;

    if (isPassed) {
      passedSubjects++;
    } else {
      if (coreSubjects.includes(mark.subject_name_bn)) {
        coreFailed = true;
      }
    }
  }

  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
  let isOverallPass = false;

  switch (policy.pass_rule) {
    case 'strict':
      isOverallPass = (passedSubjects === totalSubjects) && !coreFailed;
      break;
    case 'lenient':
      isOverallPass = percentage >= (policy.overall_pass_percent || 0);
      break;
    case 'x_of_y':
      isOverallPass = (passedSubjects >= (policy.min_subjects_to_pass || 0)) && !coreFailed;
      break;
    case 'hybrid':
      isOverallPass = (passedSubjects >= (policy.min_subjects_to_pass || 0)) && (percentage >= (policy.overall_pass_percent || 0)) && !coreFailed;
      break;
    default:
      isOverallPass = (passedSubjects === totalSubjects);
  }

  let grade = 'F';
  let gpa = 0.0;

  if (isOverallPass) {
    gradeTable.sort((a: any, b: any) => b.min - a.min); // Sort descending
    for (const rule of gradeTable) {
      if (percentage >= rule.min) {
        grade = rule.grade;
        gpa = rule.gpa;
        break;
      }
    }
  } else {
    grade = policy.on_fail || 'F';
    gpa = 0.0;
  }

  // Insert or update result
  const resultId = `res_${examId}_${studentId}`;
  await db.exec(
    `INSERT INTO exam_results (id, exam_id, student_id, total_marks, obtained_marks, percentage, gpa, grade, created_at)
     VALUES ('${resultId}', '${examId}', '${studentId}', ${totalMarks}, ${obtainedMarks}, ${percentage}, ${gpa}, '${grade}', datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       total_marks=excluded.total_marks,
       obtained_marks=excluded.obtained_marks,
       percentage=excluded.percentage,
       gpa=excluded.gpa,
       grade=excluded.grade;`
  );

  // Recalculate merit positions for this exam
  const allResults = await db.all(
    `SELECT id, percentage, gpa FROM exam_results WHERE exam_id = ?`,
    [examId]
  );
  
  // Sort by merit_by, tie_breaker
  const meritBy = policy.merit_by || 'percentage'; // or 'gpa'
  
  allResults.sort((a: any, b: any) => {
    if (meritBy === 'gpa') {
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      return b.percentage - a.percentage;
    } else {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return b.gpa - a.gpa;
    }
  });

  for (let i = 0; i < allResults.length; i++) {
    await db.run(
      `UPDATE exam_results SET merit_position = ? WHERE id = ?`,
      [i + 1, allResults[i].id]
    );
  }

  return await db.get(`SELECT * FROM exam_results WHERE id = ?`, [resultId]);
}
