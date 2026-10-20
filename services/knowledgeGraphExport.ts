import { KnowledgeGraphData, Entity, MemoryItem } from './knowledgeGraph';

/**
 * Trigger file download helper
 */
const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export all datasets as plain text (.txt)
 */
export const exportKnowledgeGraphAsTxt = (data: KnowledgeGraphData) => {
  const dateStr = new Date().toLocaleString();
  let content = `================================================================================
RAJ EXPO DIGITALS SERVER 916 (ENCRYPTED)
CENTRAL KNOWLEDGE GRAPH & DATASET AUDIT EXPORT
================================================================================
Classification: AES-256 RESTRICTED ACCESS // BOSS (MR. RAJ) & N.A.T.A.S.H.A 5.6 ASI 916
Generated At: ${dateStr}
Total Entities: ${data.entities.length}
Total Memories: ${data.memories.length}
================================================================================\n\n`;

  content += `################################################################################
SECTION 1: KNOWLEDGE GRAPH ENTITIES (${data.entities.length} TOTAL)
################################################################################\n\n`;

  data.entities.forEach((ent, idx) => {
    content += `--------------------------------------------------------------------------------\n`;
    content += `[${idx + 1}] ENTITY: ${ent.name.toUpperCase()} (Type: ${ent.type})\n`;
    content += `ID: ${ent.id} | Importance Score: ${ent.importanceScore}/100\n`;
    content += `Created: ${ent.createdDate} | Modified: ${ent.modifiedDate}\n`;
    if (ent.aliases.length > 0) {
      content += `Aliases: ${ent.aliases.join(', ')}\n`;
    }
    content += `Description:\n  ${ent.description}\n`;
    
    // Connected entities
    const connectedNames = ent.connectedEntityIds.map(id => {
      const match = data.entities.find(e => e.id === id);
      return match ? `${match.name} [${match.type}]` : id;
    });
    content += `Direct Graph Edges (${connectedNames.length}):\n  ${connectedNames.join(' <-> ')}\n`;
    content += `Linked Memories (${ent.connectedMemoryIds.length}):\n  ${ent.connectedMemoryIds.join(', ')}\n`;

    if (ent.timeline && ent.timeline.length > 0) {
      content += `Timeline Milestones (${ent.timeline.length}):\n`;
      ent.timeline.forEach(tl => {
        content += `  - [${tl.timestamp}] ${tl.eventTitle}: ${tl.eventDescription}\n`;
      });
    }
    content += `\n`;
  });

  content += `\n################################################################################
SECTION 2: MEMORIES & CONVERSATIONS ARCHIVE (${data.memories.length} TOTAL)
################################################################################\n\n`;

  data.memories.forEach((mem, idx) => {
    content += `--------------------------------------------------------------------------------\n`;
    content += `[${idx + 1}] MEMORY: ${mem.title.toUpperCase()}\n`;
    content += `Category: ${mem.category} | Importance: ${mem.importanceLevel} | Status: ${mem.status}\n`;
    content += `Recorded: ${mem.dateTime || mem.createdTime}\n`;
    if (mem.tags.length > 0) {
      content += `Tags: #${mem.tags.join(' #')}\n`;
    }
    if (mem.keywords.length > 0) {
      content += `Keywords: ${mem.keywords.join(', ')}\n`;
    }
    content += `Summary:\n  ${mem.summary}\n`;
    content += `Full Content:\n  ${mem.description}\n`;

    const connectedEntNames = mem.connectedEntityIds.map(id => {
      const match = data.entities.find(e => e.id === id);
      return match ? `${match.name} (${match.type})` : id;
    });
    content += `Linked Graph Nodes:\n  ${connectedEntNames.join(', ')}\n\n`;
  });

  content += `================================================================================
END OF EXPORT // RAJ EXPO DIGITALS SERVER 916 // NATASHA 5.6 ASI
================================================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `raj_expo_knowledge_graph_${Date.now()}.txt`);
};

/**
 * Export all datasets as styled HTML file (.html)
 */
export const exportKnowledgeGraphAsHtml = (data: KnowledgeGraphData) => {
  const dateStr = new Date().toLocaleString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Raj Expo Digitals Server 916 // Knowledge Graph Export</title>
  <style>
    :root {
      --bg: #030712;
      --card-bg: #0f172a;
      --cyan: #06b6d4;
      --cyan-glow: rgba(6, 182, 212, 0.4);
      --emerald: #10b981;
      --amber: #f59e0b;
      --text: #f8fafc;
      --muted: #94a3b8;
      --border: rgba(6, 182, 212, 0.3);
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      margin: 0;
      padding: 30px;
      line-height: 1.6;
    }
    .header {
      border: 1px solid var(--border);
      background: rgba(15, 23, 42, 0.9);
      padding: 24px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 0 30px var(--cyan-glow);
    }
    h1 { margin: 0 0 8px 0; color: #fff; font-size: 20px; letter-spacing: 2px; }
    .subtitle { color: var(--cyan); font-size: 12px; margin-bottom: 12px; }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 16px;
      font-size: 11px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .badge {
      background: #020617;
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 9999px;
      color: var(--cyan);
    }
    .badge-amber { border-color: var(--amber); color: var(--amber); }
    .badge-emerald { border-color: var(--emerald); color: var(--emerald); }
    h2 {
      font-size: 16px;
      letter-spacing: 1px;
      color: var(--cyan);
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
      margin-top: 40px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    }
    .card-title {
      font-size: 14px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-type {
      font-size: 10px;
      text-transform: uppercase;
      color: var(--cyan);
      letter-spacing: 1px;
    }
    .desc { font-family: sans-serif; font-size: 12px; color: #cbd5e1; margin: 10px 0; }
    .tag {
      background: #020617;
      border: 1px solid rgba(6, 182, 212, 0.2);
      color: #38bdf8;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 6px;
      margin-right: 4px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .timeline {
      margin-top: 12px;
      padding-left: 12px;
      border-left: 2px solid var(--border);
      font-size: 11px;
    }
    .timeline-item { margin-bottom: 8px; }
    .timeline-time { color: var(--amber); font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RAJ EXPO DIGITALS SERVER 916 (ENCRYPTED)</h1>
    <div class="subtitle">N.A.T.A.S.H.A 5.6 ASI 916 // MASTER KNOWLEDGE GRAPH ARCHIVE</div>
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">Complete interconnected relational dataset with multi-layered graph topology, incident logs, timeline, and memories.</p>
    <div class="meta-bar">
      <span class="badge">ENTITIES: ${data.entities.length}</span>
      <span class="badge badge-emerald">MEMORIES: ${data.memories.length}</span>
      <span class="badge badge-amber">ENCRYPTION: AES-256</span>
      <span class="badge">EXPORTED: ${dateStr}</span>
    </div>
  </div>

  <h2>KNOWLEDGE GRAPH ENTITIES (${data.entities.length})</h2>
  <div class="grid">
    ${data.entities.map(ent => `
      <div class="card">
        <div class="card-type">${ent.type} &bull; SCORE: ${ent.importanceScore}</div>
        <div class="card-title">
          <span>${ent.name}</span>
        </div>
        <div class="desc">${ent.description}</div>
        ${ent.aliases.length ? `
          <div style="margin-bottom: 8px;">
            ${ent.aliases.map(a => `<span class="tag">${a}</span>`).join('')}
          </div>
        ` : ''}
        <div style="font-size: 10px; color: #64748b; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
          <div>CONNECTED ENTITIES: ${ent.connectedEntityIds.length}</div>
          <div>CONNECTED MEMORIES: ${ent.connectedMemoryIds.length}</div>
        </div>
        ${ent.timeline?.length ? `
          <div class="timeline">
            ${ent.timeline.map(t => `
              <div class="timeline-item">
                <div class="timeline-time">${t.timestamp}</div>
                <strong>${t.eventTitle}</strong>: ${t.eventDescription}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <h2>MEMORIES & CONVERSATIONS DATABASE (${data.memories.length})</h2>
  <div class="grid">
    ${data.memories.map(mem => `
      <div class="card">
        <div class="card-type">${mem.category} &bull; ${mem.importanceLevel} IMPORTANCE</div>
        <div class="card-title">
          <span>${mem.title}</span>
        </div>
        <div class="desc">${mem.description}</div>
        <div>
          ${mem.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
          <div>RECORDED: ${mem.dateTime || mem.createdTime}</div>
          <div>LINKED NODES: ${mem.connectedEntityIds.length}</div>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  triggerDownload(blob, `raj_expo_knowledge_graph_${Date.now()}.html`);
};

/**
 * Export all datasets as Microsoft Word (.docx) compatible document
 */
export const exportKnowledgeGraphAsDocx = (data: KnowledgeGraphData) => {
  const dateStr = new Date().toLocaleString();

  const docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
xmlns:w='urn:schemas-microsoft-com:office:word' 
xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Raj Expo Digitals Knowledge Graph Export</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; }
    h1 { font-size: 20pt; color: #0284c7; border-bottom: 2pt solid #0284c7; padding-bottom: 6pt; margin-bottom: 4pt; }
    h2 { font-size: 15pt; color: #0369a1; margin-top: 18pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 4pt; }
    h3 { font-size: 12pt; color: #0f172a; margin-top: 12pt; }
    .badge { display: inline-block; padding: 2pt 6pt; background: #e0f2fe; color: #0369a1; border-radius: 4pt; font-size: 9pt; font-weight: bold; }
    .card { border: 1pt solid #cbd5e1; background: #f8fafc; padding: 10pt; margin-bottom: 12pt; border-radius: 6pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; }
    th, td { border: 1pt solid #cbd5e1; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
    th { background: #0284c7; color: #ffffff; }
    .timeline-box { background: #f1f5f9; padding: 6pt; border-left: 3pt solid #0284c7; margin-top: 6pt; font-size: 9pt; }
  </style>
</head>
<body>
  <h1>RAJ EXPO DIGITALS SERVER 916 (ENCRYPTED)</h1>
  <p><strong>SYSTEM ARCHIVE:</strong> Knowledge Graph Database & Interconnected Neural Memory</p>
  <p><strong>OPERATOR:</strong> Boss (Mr. Raj) & N.A.T.A.S.H.A 5.6 ASI 916</p>
  <p><strong>GENERATION DATE:</strong> ${dateStr}</p>
  <p><strong>TOTAL ENTITIES:</strong> ${data.entities.length} | <strong>TOTAL MEMORIES:</strong> ${data.memories.length}</p>

  <h2>1. ENTITIES REGISTER</h2>
  <table>
    <thead>
      <tr>
        <th>Entity Name</th>
        <th>Type</th>
        <th>Score</th>
        <th>Description</th>
        <th>Edges</th>
      </tr>
    </thead>
    <tbody>
      ${data.entities.map(ent => `
        <tr>
          <td><strong>${ent.name}</strong><br/><span style="font-size:8pt;color:#64748b;">${ent.aliases.join(', ')}</span></td>
          <td>${ent.type}</td>
          <td>${ent.importanceScore}/100</td>
          <td>${ent.description}</td>
          <td>${ent.connectedEntityIds.length} entities<br/>${ent.connectedMemoryIds.length} memories</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>2. DETAILED ENTITIES & TIMELINE EVENTS</h2>
  ${data.entities.map(ent => `
    <div class="card">
      <h3>${ent.name} (${ent.type})</h3>
      <p><strong>Importance Score:</strong> ${ent.importanceScore}/100 | <strong>Created:</strong> ${ent.createdDate}</p>
      <p>${ent.description}</p>
      ${ent.timeline && ent.timeline.length ? `
        <div class="timeline-box">
          <strong>Recorded Incidents & Milestones:</strong>
          <ul>
            ${ent.timeline.map(t => `<li><strong>${t.timestamp}</strong> - ${t.eventTitle}: ${t.eventDescription}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('')}

  <h2>3. MEMORIES & CONVERSATIONS ARCHIVE</h2>
  ${data.memories.map(mem => `
    <div class="card">
      <h3>${mem.title}</h3>
      <p><strong>Category:</strong> ${mem.category} | <strong>Importance:</strong> ${mem.importanceLevel} | <strong>Date:</strong> ${mem.dateTime || mem.createdTime}</p>
      <p>${mem.description}</p>
      <p style="font-size:9pt;color:#64748b;"><strong>Tags:</strong> ${mem.tags.join(', ')}</p>
    </div>
  `).join('')}
</body>
</html>`;

  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8'
  });
  triggerDownload(blob, `raj_expo_knowledge_graph_${Date.now()}.docx`);
};

/**
 * Export all datasets formatted for PDF printing (.pdf)
 */
export const exportKnowledgeGraphAsPdf = (data: KnowledgeGraphData) => {
  const printWin = window.open('', '_blank', 'width=1000,height=800');
  if (!printWin) {
    // If pop-up blocked, fallback to html export
    exportKnowledgeGraphAsHtml(data);
    return;
  }

  const dateStr = new Date().toLocaleString();

  const printContent = `<!DOCTYPE html>
<html>
<head>
  <title>RAJ EXPO DIGITALS // KNOWLEDGE GRAPH EXPORT</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; font-size: 11pt; }
    h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 4px; font-size: 18pt; }
    .meta { font-size: 10pt; color: #475569; margin-bottom: 24px; }
    h2 { color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px; font-size: 14pt; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
    .title { font-weight: bold; font-size: 12pt; color: #0284c7; }
    .type { font-size: 9pt; color: #64748b; text-transform: uppercase; font-weight: bold; }
    .desc { margin: 6px 0; }
    .tags { font-size: 9pt; color: #0369a1; font-family: monospace; }
    @media print {
      body { margin: 15mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#0284c7;color:#fff;padding:12px;border-radius:8px;margin-bottom:20px;text-align:center;">
    <strong>PRINT TO PDF READY:</strong> Click the button below or press Ctrl+P / Cmd+P to save as PDF.
    <br/><br/>
    <button onclick="window.print()" style="padding:8px 18px;background:#fff;color:#0284c7;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">
      PRINT / SAVE AS PDF NOW
    </button>
  </div>

  <h1>RAJ EXPO DIGITALS SERVER 916 (ENCRYPTED)</h1>
  <div class="meta">
    Knowledge Graph Database Export // N.A.T.A.S.H.A 5.6 ASI 916 // ${dateStr}
    <br/>Total Entities: ${data.entities.length} | Total Memories: ${data.memories.length}
  </div>

  <h2>ENTITIES REGISTER (${data.entities.length})</h2>
  ${data.entities.map(ent => `
    <div class="card">
      <div class="type">${ent.type} &bull; SCORE ${ent.importanceScore}</div>
      <div class="title">${ent.name}</div>
      <div class="desc">${ent.description}</div>
      ${ent.aliases.length ? `<div class="tags">Aliases: ${ent.aliases.join(', ')}</div>` : ''}
      <div style="font-size:9pt;color:#64748b;margin-top:6px;">
        Connected Nodes: ${ent.connectedEntityIds.length} &bull; Connected Memories: ${ent.connectedMemoryIds.length}
      </div>
      ${ent.timeline && ent.timeline.length ? `
        <div style="margin-top:8px;padding-left:8px;border-left:2px solid #0284c7;font-size:9pt;">
          ${ent.timeline.map(t => `<div><strong>${t.timestamp}</strong> - ${t.eventTitle}: ${t.eventDescription}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('')}

  <h2>MEMORIES ARCHIVE (${data.memories.length})</h2>
  ${data.memories.map(mem => `
    <div class="card">
      <div class="type">${mem.category} &bull; ${mem.importanceLevel}</div>
      <div class="title">${mem.title}</div>
      <div class="desc">${mem.description}</div>
      <div class="tags">#${mem.tags.join(' #')}</div>
    </div>
  `).join('')}

  <script>
    setTimeout(() => {
      window.print();
    }, 400);
  </script>
</body>
</html>`;

  printWin.document.open();
  printWin.document.write(printContent);
  printWin.document.close();
};

/**
 * Export Visual Graph Topology as Image (SVG/PNG)
 */
export const exportKnowledgeGraphAsImage = (data: KnowledgeGraphData) => {
  const width = 1600;
  const height = 1000;
  const entities = data.entities;

  // Calculate dynamic node positions
  const nodePositions: Record<string, { x: number; y: number; name: string; type: string; score: number }> = {};
  const total = entities.length;
  
  // Arrange in concentric circles or distributed grid
  entities.forEach((ent, i) => {
    let x, y;
    if (i === 0) {
      // Center node (Jonathan Raj)
      x = width / 2;
      y = height / 2;
    } else {
      const angle = ((i - 1) / (total - 1)) * 2 * Math.PI;
      const radius = 280 + ((i % 3) * 110);
      x = width / 2 + Math.cos(angle) * radius;
      y = height / 2 + Math.sin(angle) * (radius * 0.75);
    }
    nodePositions[ent.id] = { x, y, name: ent.name, type: ent.type, score: ent.importanceScore };
  });

  // Build SVG lines
  let linesSvg = '';
  entities.forEach(ent => {
    const sourcePos = nodePositions[ent.id];
    if (!sourcePos) return;
    ent.connectedEntityIds.forEach(targetId => {
      const targetPos = nodePositions[targetId];
      if (targetPos) {
        linesSvg += `<line x1="${sourcePos.x}" y1="${sourcePos.y}" x2="${targetPos.x}" y2="${targetPos.y}" stroke="#06b6d4" stroke-width="1.5" stroke-opacity="0.35" stroke-dasharray="4 4" />`;
      }
    });
  });

  // Build SVG nodes
  let nodesSvg = '';
  entities.forEach(ent => {
    const pos = nodePositions[ent.id];
    if (!pos) return;
    const isCentral = ent.id === 'ent-jonathan-raj';
    const r = isCentral ? 38 : 26;
    const fill = isCentral ? '#06b6d4' : '#0f172a';
    const stroke = isCentral ? '#22d3ee' : '#38bdf8';
    const textColor = isCentral ? '#020617' : '#ffffff';
    const badgeText = `${ent.type.slice(0, 4).toUpperCase()} ${pos.score}`;

    nodesSvg += `
      <g transform="translate(${pos.x}, ${pos.y})">
        <circle r="${r + 4}" fill="none" stroke="#22d3ee" stroke-opacity="0.25" />
        <circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />
        <text y="-${r + 8}" text-anchor="middle" fill="#38bdf8" font-size="9" font-family="monospace" font-weight="bold">${badgeText}</text>
        <text y="4" text-anchor="middle" fill="${textColor}" font-size="${isCentral ? '12' : '10'}" font-family="monospace" font-weight="900">${ent.name.slice(0, 16)}</text>
      </g>
    `;
  });

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#020617" />
        <stop offset="50%" stop-color="#091322" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    
    <!-- Title and Header Bar -->
    <rect x="40" y="30" width="${width - 80}" height="70" rx="16" fill="#0f172a" stroke="#06b6d4" stroke-width="1.5" />
    <text x="60" y="62" fill="#ffffff" font-size="18" font-family="monospace" font-weight="900" letter-spacing="2">RAJ EXPO DIGITALS SERVER 916 // KNOWLEDGE GRAPH TOPOLOGY</text>
    <text x="60" y="84" fill="#38bdf8" font-size="11" font-family="monospace">N.A.T.A.S.H.A 5.6 ASI 916 // TOTAL NODES: ${entities.length} | TOTAL MEMORIES: ${data.memories.length} | AES-256 ENCRYPTED</text>
    <text x="${width - 60}" y="72" text-anchor="end" fill="#10b981" font-size="11" font-family="monospace" font-weight="bold">ONLINE &bull; AUTO-LINKED GRAPH</text>

    <!-- Connecting Edges -->
    ${linesSvg}

    <!-- Nodes -->
    ${nodesSvg}
  </svg>`;

  // Convert SVG to PNG via HTML5 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (pngBlob) {
          triggerDownload(pngBlob, `raj_expo_knowledge_graph_snapshot_${Date.now()}.png`);
        } else {
          triggerDownload(svgBlob, `raj_expo_knowledge_graph_snapshot_${Date.now()}.svg`);
        }
      }, 'image/png');
    } else {
      triggerDownload(svgBlob, `raj_expo_knowledge_graph_snapshot_${Date.now()}.svg`);
    }
  };
  img.onerror = () => {
    // Fallback directly to SVG download
    triggerDownload(svgBlob, `raj_expo_knowledge_graph_snapshot_${Date.now()}.svg`);
  };
  img.src = url;
};
