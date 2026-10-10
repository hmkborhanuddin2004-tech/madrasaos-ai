const fs = require('fs');
let content = fs.readFileSync('client/src/components/settings/InstitutionSettingsScreen.tsx', 'utf8');

content = content.replace(
  "type SettingsTab = 'general' | 'fees' | 'academic' | 'notifications' | 'security';",
  "type SettingsTab = 'general' | 'fees' | 'academic' | 'notifications' | 'security' | 'grading-policies';"
);

const newTabButton = `
        <button
          onClick={() => setActiveTab('grading-policies')}
          className={\`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 \${
            activeTab === 'grading-policies'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }\`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Grading Policy</span>
        </button>
      </div>`;

content = content.replace("</div>\n\n      {/* ==================== TAB 1: General Info ==================== */}", newTabButton + "\n\n      {/* ==================== TAB 1: General Info ==================== */}");

const newTabContent = `
      {activeTab === 'grading-policies' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>Grading Policies</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage grading policies for the institution.
            </p>
          </div>
          <div><p className="text-sm">Grading policy management coming soon.</p></div>
        </div>
      )}
`;

content = content.replace("{/* ==================== TAB 1: General Info ==================== */}", newTabContent + "\n      {/* ==================== TAB 1: General Info ==================== */}");

fs.writeFileSync('client/src/components/settings/InstitutionSettingsScreen.tsx', content);
