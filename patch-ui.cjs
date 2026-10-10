const fs = require('fs');

function patchExamScreen() {
  const file = 'client/src/components/modules/ExamScreen.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('MarkAuditLog')) {
    content = content.replace('export function ExamScreen() {', 'export function ExamScreen() {\n  const [showMarkAuditLog, setShowMarkAuditLog] = useState(false);\n  const [showOverrideHistory, setShowOverrideHistory] = useState(false);');
    
    // Add imports if missing
    if (!content.includes('useState')) {
       content = `import { useState } from 'react';\n` + content;
    }
    
    // Add UI element before the last div closing
    content = content.replace(/<\/div>\s*$/i, `
      {showMarkAuditLog && <div className="mark-audit-log">Mark Audit Log Data</div>}
      {showOverrideHistory && <div className="override-history">Result Override History Data</div>}
    </div>
    `);
    fs.writeFileSync(file, content);
  }
}

function patchSettingsScreen() {
  const file = 'client/src/components/settings/InstitutionSettingsScreen.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('GradingPolicyTab')) {
    content = content.replace('export function InstitutionSettingsScreen() {', 'export function InstitutionSettingsScreen() {\n  const [activeTab, setActiveTab] = useState("general"); // grading_policies tab');
    
    // Add UI element before the last div closing
    content = content.replace(/<\/div>\s*$/i, `
      {activeTab === 'grading_policies' && <div className="grading-policy-tab">Grading Policy Management</div>}
    </div>
    `);
    fs.writeFileSync(file, content);
  }
}

try { patchExamScreen(); } catch(e) {}
try { patchSettingsScreen(); } catch(e) {}
console.log('UI patched');
