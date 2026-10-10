const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
    const absPath = path.join(__dirname, relPath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absPath, content.trim() + '\n', 'utf8');
    console.log(`Wrote ${relPath}`);
}

const uiCode = `
import React, { useState, useEffect } from 'react';
import { Activity, Play, Settings2, Save, Terminal, Shield, CheckCircle2 } from 'lucide-react';

export const AutomationCenter = () => {
  const [automations, setAutomations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    sms_gateway: 'console',
    bulk_sms_api_key: '',
    bulk_sms_sender_id: ''
  });
  const [dryRun, setDryRun] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [isSaving, setIsSaving] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState<string | null>(null);

  useEffect(() => {
    fetchAutomations();
    fetchLogs();
    fetchSettings();
  }, []);

  const fetchAutomations = async () => {
    const res = await fetch('http://127.0.0.1:5000/api/v1/automation/status');
    const data = await res.json();
    setAutomations(data);
  };

  const fetchLogs = async () => {
    const res = await fetch('http://127.0.0.1:5000/api/v1/automation/logs');
    const data = await res.json();
    setLogs(data);
  };

  const fetchSettings = async () => {
    const res = await fetch('http://127.0.0.1:5000/api/v1/settings');
    const data = await res.json();
    const map = data.reduce((acc: any, curr: any) => {
      acc[curr.setting_key] = curr.setting_value;
      return acc;
    }, {});
    setSettings({
      sms_gateway: map.sms_gateway || 'console',
      bulk_sms_api_key: map.bulk_sms_api_key || '',
      bulk_sms_sender_id: map.bulk_sms_sender_id || ''
    });
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await fetch('http://127.0.0.1:5000/api/v1/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: [
          { setting_key: 'sms_gateway', setting_value: settings.sms_gateway },
          { setting_key: 'bulk_sms_api_key', setting_value: settings.bulk_sms_api_key },
          { setting_key: 'bulk_sms_sender_id', setting_value: settings.bulk_sms_sender_id }
        ] })
      });
      alert('Settings Saved');
    } catch (e) {
      alert('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const runAutomation = async (key: string) => {
    setIsRunning(key);
    try {
      const res = await fetch(\`http://127.0.0.1:5000/api/v1/automation/run/\${key}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: dryRun })
      });
      const data = await res.json();
      setRunResult(data);
      fetchLogs();
    } catch (e: any) {
      setRunResult({ ok: false, messages: [e.message] });
    } finally {
      setIsRunning(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Activity /> Automation Center</h1>
          <p className="text-sm text-slate-500">Manage background tasks & SMS gateway</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-bold bg-slate-100 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-200">
            <input 
              type="checkbox" 
              checked={dryRun} 
              onChange={e => setDryRun(e.target.checked)} 
              className="w-4 h-4 rounded text-blue-600"
            />
            Dry Run Mode (No real SMS)
          </label>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button className={\`pb-2 px-2 \${activeTab === 'list' ? 'border-b-2 border-blue-600 font-bold' : ''}\`} onClick={() => setActiveTab('list')}>Automations</button>
        <button className={\`pb-2 px-2 \${activeTab === 'logs' ? 'border-b-2 border-blue-600 font-bold' : ''}\`} onClick={() => setActiveTab('logs')}>Logs</button>
        <button className={\`pb-2 px-2 \${activeTab === 'settings' ? 'border-b-2 border-blue-600 font-bold' : ''}\`} onClick={() => setActiveTab('settings')}>SMS Settings</button>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          {automations.map(auto => (
            <div key={auto.key} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{auto.name}</h3>
                <p className="text-sm text-slate-500">Schedule: {auto.cron || 'Manual'}</p>
              </div>
              <button 
                onClick={() => runAutomation(auto.key)}
                disabled={isRunning === auto.key}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold disabled:opacity-50"
              >
                {isRunning === auto.key ? 'Running...' : <><Play size={16} /> এখনই চালাও</>}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{new Date(log.started_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{log.key}</td>
                  <td className="px-4 py-3">
                    {log.ok ? <span className="text-green-600 font-bold">Success</span> : <span className="text-red-600 font-bold">Failed</span>}
                  </td>
                  <td className="px-4 py-3">
                    Processed: {log.processed}, Sent: {log.sent}, Failed: {log.failed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border max-w-2xl space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2"><Settings2 /> SMS Gateway Configuration</h2>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
              <input 
                type="radio" 
                name="gateway" 
                value="console" 
                checked={settings.sms_gateway === 'console'} 
                onChange={e => setSettings({...settings, sms_gateway: e.target.value})}
              />
              <div>
                <div className="font-bold">Console (Dev/Dry-run)</div>
                <div className="text-sm text-slate-500">Logs SMS to server console. Does not send real SMS.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
              <input 
                type="radio" 
                name="gateway" 
                value="bulk_sms_bd" 
                checked={settings.sms_gateway === 'bulk_sms_bd'} 
                onChange={e => setSettings({...settings, sms_gateway: e.target.value})}
              />
              <div>
                <div className="font-bold">BulkSmsBD</div>
                <div className="text-sm text-slate-500">Real SMS delivery via bulksmsbd.net</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
              <input 
                type="radio" 
                name="gateway" 
                value="none" 
                checked={settings.sms_gateway === 'none'} 
                onChange={e => setSettings({...settings, sms_gateway: e.target.value})}
              />
              <div>
                <div className="font-bold">Disable SMS</div>
                <div className="text-sm text-slate-500">No SMS will be sent</div>
              </div>
            </label>
          </div>

          {settings.sms_gateway === 'bulk_sms_bd' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
              <div>
                <label className="block text-sm font-bold mb-1">API Key</label>
                <input 
                  type="password" 
                  value={settings.bulk_sms_api_key} 
                  onChange={e => setSettings({...settings, bulk_sms_api_key: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Sender ID</label>
                <input 
                  type="text" 
                  value={settings.bulk_sms_sender_id} 
                  onChange={e => setSettings({...settings, bulk_sms_sender_id: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}

          <button 
            onClick={saveSettings} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold"
          >
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Result Modal */}
      {runResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              {runResult.ok ? <CheckCircle2 className="text-green-600"/> : <Shield className="text-red-600"/>}
              Execution Result
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-3 rounded border">
                <div className="text-slate-500">Processed</div>
                <div className="text-lg font-bold">{runResult.processed}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded border">
                <div className="text-slate-500">Sent</div>
                <div className="text-lg font-bold text-blue-600">{runResult.sent}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded border">
                <div className="text-slate-500">Created</div>
                <div className="text-lg font-bold">{runResult.created}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded border">
                <div className="text-slate-500">Failed/Skipped</div>
                <div className="text-lg font-bold text-amber-600">{runResult.failed} / {runResult.skipped}</div>
              </div>
            </div>

            {runResult.messages?.length > 0 && (
              <div className="bg-slate-900 text-green-400 p-3 rounded font-mono text-xs max-h-32 overflow-y-auto">
                {runResult.messages.map((m: string, i: number) => <div key={i}>{m}</div>)}
              </div>
            )}

            <button 
              onClick={() => setRunResult(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
`;

writeFile('client/src/components/automation/AutomationCenter.tsx', uiCode);
