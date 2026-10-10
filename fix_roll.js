const fs = require('fs');
const file = 'client/src/components/modules/AttendanceScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find and replace handleUpdateRoll using regex
const regex = /const handleUpdateRoll = async \(e: React\.FormEvent\) => \{[\s\S]*?setIsUpdatingRoll\(false\);\s*\}\s*\};/;

const newFn = `const handleUpdateRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRollStudent || !newRollInput.trim()) return;
    const newRoll = newRollInput.trim();
    const targetId = editingRollStudent.id;
    // Optimistic UI update — reflect immediately in state
    setStudents((prev) =>
      prev.map((s) =>
        (s.studentId === targetId || s.id === targetId)
          ? { ...s, rollNumber: newRoll, roll_number: newRoll }
          : s
      )
    );
    setEditingRollStudent(null);
    setIsUpdatingRoll(true);
    try {
      await apiCall(\`/api/v1/students/\${targetId}\`, {
        method: 'PUT',
        body: JSON.stringify({ rollNumber: newRoll })
      });
    } catch {
      fetchRegister(); // revert on API failure
    } finally {
      setIsUpdatingRoll(false);
    }
  };`;

if (regex.test(content)) {
  content = content.replace(regex, newFn);
  fs.writeFileSync(file, content, 'utf8');
  console.log('SUCCESS: Roll update optimistic fix applied');
} else {
  console.log('REGEX not matched');
  const idx = content.indexOf('handleUpdateRoll');
  console.log('Found at:', idx);
}
