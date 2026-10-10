const fs = require('fs');
const f = 'client/src/components/modules/AttendanceScreen.tsx';
let c = fs.readFileSync(f, 'utf8');

const start = c.indexOf('  const handleUpdateRoll');
const end = c.indexOf('\n  };', start) + 5;
const old = c.substring(start, end);
console.log('Old snippet found, length:', old.length);

const newFn = [
  '  const handleUpdateRoll = async (e: React.FormEvent) => {',
  '    e.preventDefault();',
  '    if (!editingRollStudent || !newRollInput.trim()) return;',
  '    const newRoll = newRollInput.trim();',
  '    const targetId = editingRollStudent.id;',
  '    setStudents((prev) =>',
  '      prev.map((s) =>',
  '        (s.studentId === targetId || s.id === targetId)',
  '          ? { ...s, rollNumber: newRoll, roll_number: newRoll }',
  '          : s',
  '      )',
  '    );',
  '    setEditingRollStudent(null);',
  '    setIsUpdatingRoll(true);',
  '    try {',
  '      await apiCall(`/api/v1/students/${targetId}`, {',
  "        method: 'PUT',",
  '        body: JSON.stringify({ rollNumber: newRoll })',
  '      });',
  '    } catch {',
  '      fetchRegister();',
  '    } finally {',
  '      setIsUpdatingRoll(false);',
  '    }',
  '  };'
].join('\n');

c = c.substring(0, start) + newFn + c.substring(end);
fs.writeFileSync(f, c, 'utf8');
console.log('SUCCESS: Roll update fixed optimistically');
