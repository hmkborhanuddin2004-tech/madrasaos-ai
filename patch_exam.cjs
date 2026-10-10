const fs = require('fs');
let content = fs.readFileSync('client/src/components/modules/ExamScreen.tsx', 'utf8');

const newAuditButton = `
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => alert('Mark audit log preview: \\nOld value: 80\\nNew value: 88\\nChanged by: admin')}
                      className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Audit Log</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">`;

content = content.replace('<td className="py-3 px-4 text-center">', newAuditButton);
content = content.replace('<th className="py-3 px-4 text-center">নম্বরপত্র</th>', '<th className="py-3 px-4 text-center">Audit</th><th className="py-3 px-4 text-center">নম্বরপত্র</th>');

fs.writeFileSync('client/src/components/modules/ExamScreen.tsx', content);
