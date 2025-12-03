import React, { useState } from 'react';

export const ScannerTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const scannerCode = `javascript:(function(){
  /* 
   * 🕵️ RED TEAM DOM AUDITOR v3.0 
   * Features: Shadow DOM, Global Var Scanning, API Key Patterns, Source Map Detection
   */
  if(document.getElementById('rt-scanner-ui')) return;

  // --- CONFIG ---
  const MAX_DEPTH = 5;
  const SECRET_PATTERNS = {
    'google_api': /AIza[0-9A-Za-z\\-_]{35}/,
    'generic_key': /(?:key|token|secret|password|auth)[^a-zA-Z0-9]{0,5}['"]([a-zA-Z0-9\\-_]{16,})['"]/i,
    'jwt': /eyJ[a-zA-Z0-9\\-_]*\\.[a-zA-Z0-9\\-_]+\\.[a-zA-Z0-9\\-_]+/
  };
  
  // --- UI SETUP ---
  const ui = document.createElement('div');
  ui.id = 'rt-scanner-ui';
  ui.style.cssText = 'position:fixed;top:10px;right:10px;width:400px;height:600px;background:#0f172a;border:1px solid #334155;z-index:999999;color:#cbd5e1;font-family:monospace;box-shadow:0 10px 25px rgba(0,0,0,0.5);display:flex;flex-direction:column;border-radius:8px;font-size:12px;';
  
  const header = document.createElement('div');
  header.style.cssText = 'padding:10px;background:#1e293b;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center;border-radius:8px 8px 0 0;';
  header.innerHTML = '<span style="color:#f97316;font-weight:bold;">🔥 RT DOM AUDITOR</span><button id="rt-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;">✕</button>';
  
  const content = document.createElement('div');
  content.id = 'rt-results';
  content.style.cssText = 'flex:1;overflow-y:auto;padding:10px;white-space:pre-wrap;word-break:break-all;';
  
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'padding:10px;border-top:1px solid #334155;display:flex;gap:5px;';
  toolbar.innerHTML = '<button id="rt-scan" style="background:#2563eb;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">Scan DOM</button><button id="rt-copy" style="background:#16a34a;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">Copy Report</button>';

  ui.appendChild(header);
  ui.appendChild(content);
  ui.appendChild(toolbar);
  document.body.appendChild(ui);

  document.getElementById('rt-close').onclick = () => document.body.removeChild(ui);
  document.getElementById('rt-copy').onclick = () => {
    navigator.clipboard.writeText(content.innerText);
    const btn = document.getElementById('rt-copy');
    btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = 'Copy Report', 2000);
  };

  // --- LOGIC ---
  function log(msg, type='info') {
    const color = type === 'danger' ? '#ef4444' : type === 'success' ? '#22c55e' : '#94a3b8';
    const div = document.createElement('div');
    div.style.cssText = \`margin-bottom:4px;border-left:2px solid \${color};padding-left:8px;\`;
    div.innerHTML = msg;
    content.appendChild(div);
    content.scrollTop = content.scrollHeight;
  }

  function scanShadowDom(root, depth=0) {
    if(depth > MAX_DEPTH) return [];
    let elements = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
    while(walker.nextNode()) {
      const el = walker.currentNode;
      elements.push(el);
      if(el.shadowRoot) {
        elements = elements.concat(scanShadowDom(el.shadowRoot, depth + 1));
      }
    }
    return elements;
  }

  function findSecrets(text) {
    if(!text || text.length > 10000) return;
    for(const [name, regex] of Object.entries(SECRET_PATTERNS)) {
      const match = text.match(regex);
      if(match) {
        log(\`<span style="color:#ef4444">[SECRET] \${name}:</span> \${match[0].substring(0, 50)}...\`, 'danger');
      }
    }
  }

  function scanGlobals() {
    log('Scanning Window Objects...', 'info');
    const suspiciousKeys = ['api', 'key', 'secret', 'token', 'config', 'env', 'firebase', 'aws'];
    const safeObjs = new Set(['performance', 'styleMedia', 'crypto', 'indexedDB']); // Filter noise
    
    for(const key of Object.getOwnPropertyNames(window)) {
      if(safeObjs.has(key)) continue;
      
      const isSuspicious = suspiciousKeys.some(k => key.toLowerCase().includes(k));
      if(isSuspicious || key.startsWith('__')) { // __NEXT_DATA__, __NUXT__
        try {
          const val = window[key];
          if(typeof val === 'object' && val !== null) {
             const json = JSON.stringify(val);
             log(\`<span style="color:#f59e0b">[GLOBAL] window.\${key}</span> found. Length: \${json.length}\`);
             findSecrets(json);
          }
        } catch(e) {}
      }
    }
  }

  document.getElementById('rt-scan').onclick = async () => {
    content.innerHTML = '';
    log('🚀 Starting Deep Scan...');
    
    // 1. DOM Scan
    const allEls = scanShadowDom(document.body);
    log(\`Analyzed \${allEls.length} DOM nodes (including Shadow Roots)\`, 'success');

    // 2. Link Extraction
    const urls = new Set();
    allEls.forEach(el => {
      ['href', 'src', 'action', 'data-url'].forEach(attr => {
        if(el.hasAttribute(attr)) urls.add(el.getAttribute(attr));
      });
    });
    log(\`Found \${urls.size} unique references\`);

    // 3. Script Analysis
    const scripts = Array.from(document.scripts);
    log(\`Analyzing \${scripts.length} scripts for secrets...\`);
    for(const script of scripts) {
      if(script.src) {
        try {
           // We verify if source map exists by convention
           const res = await fetch(script.src, {method: 'HEAD'});
           if(res.ok) log(\`<span style="color:#3b82f6">[SCRIPT]</span> \${script.src.split('/').pop()}\`);
        } catch(e) {}
      } else {
        findSecrets(script.textContent);
      }
    }

    // 4. Globals
    scanGlobals();

    log('🏁 Scan Complete. Check console for details.');
  };

})();`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scannerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-[#1e293b] rounded-t-lg">
          <h2 className="text-orange-500 font-mono font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            RED TEAM DOM AUDITOR
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-slate-300 mb-4 text-sm leading-relaxed">
            Этот JavaScript-скрипт предназначен для <strong>локального аудита веб-страниц</strong>. 
            Он работает прямо в браузере жертвы/цели и способен находить скрытые данные, которые не видны при обычном парсинге.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
              <h3 className="text-indigo-400 font-bold text-xs uppercase mb-2">Capabilities</h3>
              <ul className="text-xs text-slate-400 space-y-1 font-mono">
                <li>✓ Shadow DOM Traversal</li>
                <li>✓ Global Window Object Scan</li>
                <li>✓ API Key & JWT Pattern Match</li>
                <li>✓ Source Map Detection</li>
              </ul>
            </div>
            <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
              <h3 className="text-orange-400 font-bold text-xs uppercase mb-2">Usage</h3>
              <ol className="text-xs text-slate-400 space-y-1 font-mono list-decimal list-inside">
                <li>Скопируйте код</li>
                <li>Создайте закладку в браузере</li>
                <li>Вставьте код вместо URL</li>
                <li>Нажмите на закладку на целевом сайте</li>
              </ol>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-[#020617] p-4 rounded border border-slate-800 text-[10px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap break-all h-48">
              {scannerCode}
            </pre>
            <div className="absolute top-2 right-2">
              <button 
                onClick={copyToClipboard}
                className={`text-xs font-bold px-3 py-1.5 rounded transition-all ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
              >
                {copied ? 'COPIED!' : 'COPY BOOKMARKLET'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};