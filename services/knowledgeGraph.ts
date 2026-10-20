export type EntityType = 
  | 'Person'
  | 'Incident'
  | 'Conversation'
  | 'Reminder'
  | 'Task'
  | 'Project'
  | 'Prompt'
  | 'App'
  | 'Website'
  | 'Company'
  | 'Device'
  | 'File'
  | 'Folder'
  | 'AI Model'
  | 'University'
  | 'Business'
  | 'Place'
  | 'Event'
  | 'Contact'
  | 'PhoneNumber'
  | 'Email'
  | 'BankAccount'
  | 'Vehicle'
  | 'Tool'
  | 'ProgrammingLanguage'
  | 'Skill'
  | 'Goal'
  | 'Idea'
  | 'Note';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  eventTitle: string;
  eventDescription: string;
  relatedEntityIds: string[];
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  aliases: string[];
  description: string;
  createdDate: string;
  modifiedDate: string;
  importanceScore: number; // 1-100
  timeline: TimelineEvent[];
  connectedEntityIds: string[]; // Graph edge links to other entities
  connectedMemoryIds: string[]; // Graph edge links to memories
  details?: Record<string, any>;
}

export interface MemoryItem {
  id: string;
  title: string;
  category: string;
  description: string;
  dateTime: string;
  createdTime: string;
  lastUpdated: string;
  importanceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'Active' | 'Archived' | 'Deleted';
  tags: string[];
  keywords: string[];
  summary: string;
  connectedEntityIds: string[];
}

export interface KnowledgeGraphData {
  entities: Entity[];
  memories: MemoryItem[];
}

const STORAGE_KEY = 'raj_expo_knowledge_graph_v1';

// Seed Initial Knowledge Graph Data with Rich Interconnections
const INITIAL_GRAPH_DATA: KnowledgeGraphData = {
  entities: [
    {
      id: 'ent-jonathan-raj',
      name: 'Jonathan Raj',
      type: 'Person',
      aliases: ['Boss', 'Mr. Raj', 'Jonathan'],
      description: 'Founder & Chief Operating Officer at Raj Expo Digitals. Oversees system mainframes and automation AI.',
      createdDate: new Date(Date.now() - 86400000 * 30).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 98,
      timeline: [
        {
          id: 'tl-1',
          timestamp: new Date(Date.now() - 86400000 * 5).toLocaleString(),
          eventTitle: 'Initiated Amazon Assessment Project',
          eventDescription: 'Jonathan Raj assigned Dilan to coordinate Amazon Assessment cloud parameters.',
          relatedEntityIds: ['ent-amazon-assessment', 'ent-dilan']
        },
        {
          id: 'tl-2',
          timestamp: new Date(Date.now() - 86400000 * 2).toLocaleString(),
          eventTitle: 'Deployed Natasha V.I. 4.6 Cobra Guard',
          eventDescription: 'Configured neural mainframe broadcast and knowledge graph engine.',
          relatedEntityIds: ['ent-natasha', 'ent-raj-expo']
        }
      ],
      connectedEntityIds: [
        'ent-raj-expo',
        'ent-ai-studio',
        'ent-natasha',
        'ent-amazon-assessment',
        'ent-kickboxing',
        'ent-nl-bookshop',
        'ent-university',
        'ent-graphic-design',
        'ent-python',
        'ent-dilan'
      ],
      connectedMemoryIds: ['mem-1', 'mem-2', 'mem-3']
    },
    {
      id: 'ent-dilan',
      name: 'Dilan',
      type: 'Person',
      aliases: ['Dilan Technical Lead', 'Dilan K.'],
      description: 'Senior Technical Lead collaborating on Amazon Assessment and printline systems.',
      createdDate: new Date(Date.now() - 86400000 * 20).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 85,
      timeline: [
        {
          id: 'tl-3',
          timestamp: new Date(Date.now() - 86400000 * 4).toLocaleString(),
          eventTitle: 'Completed Amazon Assessment Module 1',
          eventDescription: 'Dilan submitted test metrics and code profiles to Jonathan Raj.',
          relatedEntityIds: ['ent-jonathan-raj', 'ent-amazon-assessment']
        }
      ],
      connectedEntityIds: ['ent-jonathan-raj', 'ent-amazon-assessment', 'ent-python', 'ent-raj-expo'],
      connectedMemoryIds: ['mem-2']
    },
    {
      id: 'ent-natasha',
      name: 'Natasha V.I. 4.6',
      type: 'AI Model',
      aliases: ['Natasha', 'Cobra Guard', 'V.I. Assistant'],
      description: 'Virtual Intelligence Core powering Raj Expo Digitals system broadcasts, file analysis, and chat automation.',
      createdDate: new Date(Date.now() - 86400000 * 60).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 95,
      timeline: [
        {
          id: 'tl-4',
          timestamp: new Date().toLocaleString(),
          eventTitle: 'Knowledge Graph Central Database Online',
          eventDescription: 'Natasha automatically indexed all entities and connected memory trees.',
          relatedEntityIds: ['ent-jonathan-raj', 'ent-raj-expo']
        }
      ],
      connectedEntityIds: ['ent-jonathan-raj', 'ent-raj-expo', 'ent-ai-studio'],
      connectedMemoryIds: ['mem-1', 'mem-3']
    },
    {
      id: 'ent-raj-expo',
      name: 'Raj Expo Digitals',
      type: 'Company',
      aliases: ['Raj Expo', 'Raj Expo Mainframe'],
      description: 'Premier printing, digital media, document counting, and software solutions enterprise.',
      createdDate: new Date(Date.now() - 86400000 * 180).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 100,
      timeline: [
        {
          id: 'tl-5',
          timestamp: new Date(Date.now() - 86400000 * 10).toLocaleString(),
          eventTitle: 'System Upgrade to Dual-sided Duplex Engine',
          eventDescription: 'Integrated automatic page counting and cost estimation algorithm.',
          relatedEntityIds: ['ent-jonathan-raj']
        }
      ],
      connectedEntityIds: ['ent-jonathan-raj', 'ent-natasha', 'ent-ai-studio', 'ent-nl-bookshop'],
      connectedMemoryIds: ['mem-1', 'mem-2', 'mem-3']
    },
    {
      id: 'ent-amazon-assessment',
      name: 'Amazon Assessment',
      type: 'Incident',
      aliases: ['Amazon AWS Evaluation', 'AWS Cloud Test'],
      description: 'High-priority enterprise technical assessment and cloud server performance benchmark.',
      createdDate: new Date(Date.now() - 86400000 * 7).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 90,
      timeline: [
        {
          id: 'tl-6',
          timestamp: new Date(Date.now() - 86400000 * 3).toLocaleString(),
          eventTitle: 'Benchmark Test Executed',
          eventDescription: 'Jonathan Raj and Dilan completed stress testing on Python cloud worker.',
          relatedEntityIds: ['ent-jonathan-raj', 'ent-dilan', 'ent-python']
        }
      ],
      connectedEntityIds: ['ent-jonathan-raj', 'ent-dilan', 'ent-python'],
      connectedMemoryIds: ['mem-2']
    },
    {
      id: 'ent-kickboxing',
      name: 'Kickboxing',
      type: 'Goal',
      aliases: ['Martial Arts Training', 'Fitness Routine'],
      description: 'Physical endurance, discipline, and agility training program for Jonathan Raj.',
      createdDate: new Date(Date.now() - 86400000 * 45).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 70,
      timeline: [],
      connectedEntityIds: ['ent-jonathan-raj'],
      connectedMemoryIds: []
    },
    {
      id: 'ent-nl-bookshop',
      name: 'NL Bookshop',
      type: 'Business',
      aliases: ['NL Stationers', 'Bookshop Retail'],
      description: 'Partner retail vendor providing premium paper, toner, and binding media for Raj Expo Digitals.',
      createdDate: new Date(Date.now() - 86400000 * 90).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 75,
      timeline: [],
      connectedEntityIds: ['ent-raj-expo', 'ent-jonathan-raj'],
      connectedMemoryIds: ['mem-3']
    },
    {
      id: 'ent-university',
      name: 'University Academic Portal',
      type: 'University',
      aliases: ['Campus Network', 'Academic Research'],
      description: 'Higher education research network and document repository.',
      createdDate: new Date(Date.now() - 86400000 * 120).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 80,
      timeline: [],
      connectedEntityIds: ['ent-jonathan-raj'],
      connectedMemoryIds: []
    },
    {
      id: 'ent-graphic-design',
      name: 'Graphic Design Matrix',
      type: 'Skill',
      aliases: ['UI/UX Design', 'Visual Graphics'],
      description: 'High-speed CMYK vector rendering, typography pairing, and visual aesthetic composition.',
      createdDate: new Date(Date.now() - 86400000 * 200).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 88,
      timeline: [],
      connectedEntityIds: ['ent-jonathan-raj', 'ent-raj-expo'],
      connectedMemoryIds: ['mem-1']
    },
    {
      id: 'ent-python',
      name: 'Python 3.12 Engine',
      type: 'ProgrammingLanguage',
      aliases: ['Python', 'PyEngine'],
      description: 'Core backend automation language utilized in high-density data mining and cloud benchmarking.',
      createdDate: new Date(Date.now() - 86400000 * 150).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 82,
      timeline: [],
      connectedEntityIds: ['ent-jonathan-raj', 'ent-dilan', 'ent-amazon-assessment'],
      connectedMemoryIds: ['mem-2']
    },
    {
      id: 'ent-ai-studio',
      name: 'Google AI Studio',
      type: 'App',
      aliases: ['AI Studio Build', 'GCP AI Studio'],
      description: 'Cloud environment powering Raj Expo Digitals full-stack applet container.',
      createdDate: new Date(Date.now() - 86400000 * 30).toLocaleString(),
      modifiedDate: new Date().toLocaleString(),
      importanceScore: 92,
      timeline: [],
      connectedEntityIds: ['ent-jonathan-raj', 'ent-natasha', 'ent-raj-expo'],
      connectedMemoryIds: ['mem-1']
    }
  ],
  memories: [
    {
      id: 'mem-1',
      title: 'Raj Expo Mainframe Deployment & Natasha V.I.',
      category: 'System Architecture',
      description: 'Deploys Natasha 4.6 Cobra Guard virtual intelligence engine to manage real-time print calculation, knowledge graphs, and server tasks for Jonathan Raj.',
      dateTime: new Date(Date.now() - 86400000 * 2).toLocaleString(),
      createdTime: new Date(Date.now() - 86400000 * 2).toLocaleString(),
      lastUpdated: new Date().toLocaleString(),
      importanceLevel: 'CRITICAL',
      status: 'Active',
      tags: ['Deployment', 'AI', 'Mainframe', 'Graphic Design'],
      keywords: ['Jonathan Raj', 'Raj Expo', 'Natasha', 'AI Studio', 'Graphic Design'],
      summary: 'Deployment of Natasha V.I. on Raj Expo Digitals mainframe for automated server operations.',
      connectedEntityIds: ['ent-jonathan-raj', 'ent-natasha', 'ent-raj-expo', 'ent-ai-studio', 'ent-graphic-design']
    },
    {
      id: 'mem-2',
      title: 'Amazon Assessment Stress Benchmark Session',
      category: 'Cloud Engineering',
      description: 'Jonathan Raj and Dilan executed stress test scripts in Python to evaluate container scalability during high-concurrency jobs.',
      dateTime: new Date(Date.now() - 86400000 * 4).toLocaleString(),
      createdTime: new Date(Date.now() - 86400000 * 4).toLocaleString(),
      lastUpdated: new Date().toLocaleString(),
      importanceLevel: 'HIGH',
      status: 'Active',
      tags: ['Amazon', 'Python', 'Benchmark', 'Dilan'],
      keywords: ['Jonathan Raj', 'Dilan', 'Amazon Assessment', 'Python', 'Raj Expo'],
      summary: 'Stress benchmarking session for Amazon Assessment cloud container conducted by Jonathan Raj and Dilan.',
      connectedEntityIds: ['ent-jonathan-raj', 'ent-dilan', 'ent-amazon-assessment', 'ent-python', 'ent-raj-expo']
    },
    {
      id: 'mem-3',
      title: 'NL Bookshop Supply Agreement Finalization',
      category: 'Business Operations',
      description: 'Negotiated wholesale procurement for heavy duty A4 paper reels and high-yield black toner with NL Bookshop.',
      dateTime: new Date(Date.now() - 86400000 * 8).toLocaleString(),
      createdTime: new Date(Date.now() - 86400000 * 8).toLocaleString(),
      lastUpdated: new Date().toLocaleString(),
      importanceLevel: 'MEDIUM',
      status: 'Active',
      tags: ['Procurement', 'NL Bookshop', 'Paper'],
      keywords: ['Jonathan Raj', 'Raj Expo', 'NL Bookshop', 'Natasha'],
      summary: 'Wholesale paper & printing supply arrangement agreed with NL Bookshop.',
      connectedEntityIds: ['ent-jonathan-raj', 'ent-raj-expo', 'ent-nl-bookshop', 'ent-natasha']
    }
  ]
};

// Retrieve Graph Data from Storage
export const getStoredKnowledgeGraph = (): KnowledgeGraphData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.entities && parsed.memories) {
        // Filter out legacy mock data if present
        const filteredEntities = parsed.entities.filter((e: any) => !e.id?.includes('ent-jonathan-raj') || e.isUserCreated);
        const filteredMemories = parsed.memories.filter((m: any) => !m.id?.includes('mem-1') && !m.id?.includes('mem-2') || m.isUserCreated);
        return {
          entities: filteredEntities,
          memories: filteredMemories
        };
      }
    }
  } catch (err) {
    console.error('Error loading Knowledge Graph data:', err);
  }

  return { entities: [], memories: [] };
};

// Save Graph Data to Storage & Dispatch Event
export const saveKnowledgeGraph = (data: KnowledgeGraphData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('knowledge-graph-updated', { detail: data }));
  } catch (err) {
    console.error('Error saving Knowledge Graph data:', err);
  }
};

// Automatic Relation Engine: Link New Memory to Existing & New Entities
export const autoLinkAndIngestMemory = (
  title: string,
  description: string,
  category: string,
  tags: string[] = [],
  importanceLevel: MemoryItem['importanceLevel'] = 'MEDIUM'
): { memory: MemoryItem; newEntitiesCount: number } => {
  const currentData = getStoredKnowledgeGraph();
  const textToScan = `${title} ${description} ${category} ${tags.join(' ')}`.toLowerCase();

  const connectedEntityIds: string[] = [];
  let newEntitiesCount = 0;

  // 1. Scan existing entities
  currentData.entities.forEach(ent => {
    const nameMatch = textToScan.includes(ent.name.toLowerCase());
    const aliasMatch = ent.aliases.some(alias => textToScan.includes(alias.toLowerCase()));
    if (nameMatch || aliasMatch) {
      if (!connectedEntityIds.includes(ent.id)) {
        connectedEntityIds.push(ent.id);
      }
    }
  });

  // Default link to Jonathan Raj and Raj Expo if no entities detected
  if (!connectedEntityIds.includes('ent-jonathan-raj')) connectedEntityIds.push('ent-jonathan-raj');
  if (!connectedEntityIds.includes('ent-raj-expo')) connectedEntityIds.push('ent-raj-expo');

  // Create Memory Item
  const newMemory: MemoryItem = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    category: category || 'General',
    description,
    dateTime: new Date().toLocaleString(),
    createdTime: new Date().toLocaleString(),
    lastUpdated: new Date().toLocaleString(),
    importanceLevel,
    status: 'Active',
    tags,
    keywords: Array.from(new Set([
      ...title.split(' '),
      ...category.split(' '),
      ...tags
    ])).filter(k => k.length > 2),
    summary: description.slice(0, 140) + (description.length > 140 ? '...' : ''),
    connectedEntityIds
  };

  // Update memory list
  const updatedMemories = [newMemory, ...currentData.memories];

  // Bidirectionally update all connected entities
  const updatedEntities = currentData.entities.map(ent => {
    if (connectedEntityIds.includes(ent.id)) {
      const updatedMemIds = Array.from(new Set([newMemory.id, ...ent.connectedMemoryIds]));
      
      // Auto cross-link connected entities among each other to ensure dense graph topology
      const otherConnected = connectedEntityIds.filter(id => id !== ent.id);
      const updatedEntIds = Array.from(new Set([...otherConnected, ...ent.connectedEntityIds]));

      const newTimelineEvent: TimelineEvent = {
        id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toLocaleString(),
        eventTitle: `New Memory Linked: ${title}`,
        eventDescription: description.slice(0, 100),
        relatedEntityIds: otherConnected
      };

      return {
        ...ent,
        modifiedDate: new Date().toLocaleString(),
        connectedMemoryIds: updatedMemIds,
        connectedEntityIds: updatedEntIds,
        timeline: [newTimelineEvent, ...ent.timeline]
      };
    }
    return ent;
  });

  const finalData: KnowledgeGraphData = {
    entities: updatedEntities,
    memories: updatedMemories
  };

  saveKnowledgeGraph(finalData);

  return { memory: newMemory, newEntitiesCount };
};

// Add / Update Single Entity
export const addOrUpdateEntity = (entity: Entity): void => {
  const current = getStoredKnowledgeGraph();
  const existingIdx = current.entities.findIndex(e => e.id === entity.id);
  
  let updatedEntities: Entity[];
  if (existingIdx >= 0) {
    updatedEntities = [...current.entities];
    updatedEntities[existingIdx] = {
      ...entity,
      modifiedDate: new Date().toLocaleString()
    };
  } else {
    updatedEntities = [entity, ...current.entities];
  }

  saveKnowledgeGraph({
    ...current,
    entities: updatedEntities
  });
};

// Clear / Reset Knowledge Graph to defaults
export const resetKnowledgeGraphToDefault = (): void => {
  saveKnowledgeGraph(INITIAL_GRAPH_DATA);
};

// Check for existing memory by title
export const findExistingMemory = (title: string): MemoryItem | undefined => {
  const current = getStoredKnowledgeGraph();
  const cleanTitle = title.trim().toLowerCase();
  return current.memories.find(m => m.title.trim().toLowerCase() === cleanTitle);
};

// Check for existing entity by name or aliases
export const findExistingEntity = (name: string): Entity | undefined => {
  const current = getStoredKnowledgeGraph();
  const cleanName = name.trim().toLowerCase();
  return current.entities.find(e => 
    e.name.trim().toLowerCase() === cleanName ||
    e.aliases.some(a => a.trim().toLowerCase() === cleanName)
  );
};

// Update existing memory with explicit date directive
export const updateExistingMemoryWithDirective = (
  id: string,
  updatedData: Partial<MemoryItem>,
  updateDate: boolean
): void => {
  const current = getStoredKnowledgeGraph();
  const existingIdx = current.memories.findIndex(m => m.id === id);
  if (existingIdx === -1) return;

  const existing = current.memories[existingIdx];
  const now = new Date().toLocaleString();

  const updated: MemoryItem = {
    ...existing,
    ...updatedData,
    dateTime: updateDate ? now : existing.dateTime,
    lastUpdated: updateDate ? now : existing.lastUpdated,
    createdTime: existing.createdTime // preserve original creation time
  };

  const newMemories = [...current.memories];
  newMemories[existingIdx] = updated;

  saveKnowledgeGraph({
    ...current,
    memories: newMemories
  });
};

// Update existing entity with explicit date directive
export const updateExistingEntityWithDirective = (
  id: string,
  updatedData: Partial<Entity>,
  updateDate: boolean
): void => {
  const current = getStoredKnowledgeGraph();
  const existingIdx = current.entities.findIndex(e => e.id === id);
  if (existingIdx === -1) return;

  const existing = current.entities[existingIdx];
  const now = new Date().toLocaleString();

  const updated: Entity = {
    ...existing,
    ...updatedData,
    modifiedDate: updateDate ? now : existing.modifiedDate,
    createdDate: existing.createdDate
  };

  const newEntities = [...current.entities];
  newEntities[existingIdx] = updated;

  saveKnowledgeGraph({
    ...current,
    entities: newEntities
  });
};

// Delete a memory item by ID
export const deleteMemoryItem = (id: string): void => {
  const current = getStoredKnowledgeGraph();
  const updatedMemories = current.memories.filter(m => m.id !== id);
  const updatedEntities = current.entities.map(ent => ({
    ...ent,
    connectedMemoryIds: (ent.connectedMemoryIds || []).filter(mId => mId !== id)
  }));
  saveKnowledgeGraph({
    ...current,
    memories: updatedMemories,
    entities: updatedEntities
  });
};

