import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cloudinary Credentials from Environment
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '619184243475656';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'PDFidaYVsxxKnOZagx4KV8q-l3E';
const CLOUDINARY_CLOUD_NAME = 'uhysx6is';

const getCloudinaryAuthHeader = () => {
  const credentials = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
};

// Initialize Gemini SDK with server-side key
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
}

// ==========================================
// CLOUDINARY SERVER-SIDE API PROXY ENDPOINTS
// ==========================================

// 1. List Resources (with type, folder prefix, cursor pagination, and search)
app.get('/api/cloudinary/resources', async (req: Request, res: Response) => {
  try {
    const resourceType = (req.query.resource_type as string) || 'image';
    const maxResults = parseInt((req.query.max_results as string) || '30', 10);
    const nextCursor = req.query.next_cursor as string;
    const prefix = req.query.prefix as string;
    const type = (req.query.type as string) || 'upload';

    let endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/${resourceType}?type=${type}&max_results=${maxResults}&tags=true&context=true`;

    if (nextCursor) {
      endpoint += `&next_cursor=${encodeURIComponent(nextCursor)}`;
    }
    if (prefix) {
      endpoint += `&prefix=${encodeURIComponent(prefix)}`;
    }

    const response = await fetch(endpoint, {
      headers: {
        Authorization: getCloudinaryAuthHeader(),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Cloudinary API error ${response.status}`,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Cloudinary resources:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Fetch Storage Usage & Statistics
app.get('/api/cloudinary/usage', async (_req: Request, res: Response) => {
  try {
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/usage`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: getCloudinaryAuthHeader(),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Cloudinary API error ${response.status}`,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Cloudinary usage:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 3. List Folders & Subfolders
app.get('/api/cloudinary/folders', async (req: Request, res: Response) => {
  try {
    const folderPath = req.query.path as string;
    let endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/folders`;
    if (folderPath && folderPath.trim()) {
      endpoint += `/${encodeURIComponent(folderPath.trim())}`;
    }

    const response = await fetch(endpoint, {
      headers: {
        Authorization: getCloudinaryAuthHeader(),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Cloudinary folders error ${response.status}`,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Cloudinary folders:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 4. Create Folder
app.post('/api/cloudinary/folders', async (req: Request, res: Response) => {
  try {
    const { folderPath } = req.body;
    if (!folderPath || !folderPath.trim()) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/folders/${encodeURIComponent(folderPath.trim())}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: getCloudinaryAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Failed to create folder (${response.status})`,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error creating Cloudinary folder:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 5. Delete Folder
app.delete('/api/cloudinary/folders', async (req: Request, res: Response) => {
  try {
    const folderPath = req.query.path as string;
    if (!folderPath || !folderPath.trim()) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/folders/${encodeURIComponent(folderPath.trim())}`;
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: getCloudinaryAuthHeader(),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Failed to delete folder (${response.status})`,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error deleting Cloudinary folder:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 6. List All Account Tags
app.get('/api/cloudinary/tags', async (req: Request, res: Response) => {
  try {
    const prefix = req.query.prefix as string;
    const maxResults = parseInt((req.query.max_results as string) || '100', 10);

    const resourceType = (req.query.resource_type as string) || 'image';
    let endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/tags/${resourceType}?max_results=${maxResults}`;
    if (prefix) {
      endpoint += `&prefix=${encodeURIComponent(prefix)}`;
    }

    const response = await fetch(endpoint, {
      headers: {
        Authorization: getCloudinaryAuthHeader(),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Failed to fetch tags (${response.status})`,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Cloudinary tags:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 7. Update Tags on Asset (add, remove, replace)
app.post('/api/cloudinary/tags', async (req: Request, res: Response) => {
  try {
    const { public_id, tags, command } = req.body;
    // command: 'add' | 'remove' | 'replace' | 'set_tags'
    if (!public_id || !tags) {
      return res.status(400).json({ error: 'public_id and tags are required' });
    }

    const tagCommand = command || 'set_tags';
    const tagList = Array.isArray(tags) ? tags.join(',') : tags;

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/tags`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: getCloudinaryAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag: tagList,
        public_ids: [public_id],
        command: tagCommand,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Failed to update tags (${response.status})`,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error updating tags:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 8. Rename Asset / Move Asset
app.post('/api/cloudinary/rename', async (req: Request, res: Response) => {
  try {
    const { from_public_id, to_public_id, resource_type, overwrite } = req.body;
    if (!from_public_id || !to_public_id) {
      return res.status(400).json({ error: 'from_public_id and to_public_id are required' });
    }

    const type = resource_type || 'image';
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/${type}/upload`;

    // To rename in Cloudinary REST API, we use rename endpoint with form body
    const params = new URLSearchParams();
    params.append('from_public_id', from_public_id);
    params.append('to_public_id', to_public_id);
    if (overwrite) params.append('overwrite', 'true');

    const renameUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/rename`;
    const response = await fetch(renameUrl, {
      method: 'POST',
      headers: {
        Authorization: getCloudinaryAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Failed to rename asset (${response.status})`,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error renaming asset:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 9. Delete Asset
app.delete('/api/cloudinary/resources', async (req: Request, res: Response) => {
  try {
    const publicId = req.query.public_id as string;
    const resourceType = (req.query.resource_type as string) || 'image';

    if (!publicId) {
      return res.status(400).json({ error: 'public_id is required' });
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/${resourceType}/upload?public_ids[]=${encodeURIComponent(publicId)}`;
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: getCloudinaryAuthHeader(),
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || `Failed to delete asset (${response.status})`,
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ==========================================
// AI WRITER & SMART TAG GENERATOR ENDPOINTS
// ==========================================

const STRICT_OUTPUT_RULE = `Perform only the task explicitly requested. Return only the requested deliverable. Do not include headings, titles, introductions, greetings, explanations, conclusions, summaries, footers, disclaimers, suggestions, or extra text unless explicitly requested. Follow the specified language, format, length, quantity, and structure exactly. Use the supplied content as the source of truth and never invent missing details. If tags only are requested, output tags only. Determine tag quantity based on the description rather than adding unnecessary tags. Do not include unrelated or repetitive tags.`;

// 10. AI Description Writer (In-App)
app.post('/api/ai/improve-description', async (req: Request, res: Response) => {
  const { description, instructions, outputFormat, customFormat } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Description is required' });
  }

  const trimmedDesc = description.trim();

  // Helper for deterministic fallback formatting
  const formatFallbackOutput = (desc: string, fmt?: string, custom?: string) => {
    switch (fmt) {
      case 'Markdown':
        return `### Description\n\n${desc}`;
      case 'HTML':
        return `<div class="raj-expo-description">\n  <p>${desc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>\n</div>`;
      case 'JSON':
        return JSON.stringify({ description: desc, format: 'JSON' }, null, 2);
      case 'Custom Format':
        if (custom && custom.includes('{description}')) {
          return custom.replace(/\{description\}/g, desc);
        }
        return `${desc} (Format: ${custom || 'Custom'})`;
      case 'Plain Text':
      default:
        return desc;
    }
  };

  try {
    if (aiClient) {
      const systemPrompt = `You are an expert description writer for Raj Expo Digitals.
Task: Write or improve the supplied description according to the instructions and selected output format: ${outputFormat || 'Plain Text'}${customFormat ? ` (Format details: ${customFormat})` : ''}.
Preserve the original meaning and never invent details.
${STRICT_OUTPUT_RULE}`;

      const userPrompt = `Supplied Description:
${trimmedDesc}

Additional Instructions:
${instructions || 'Enhance clarity, conciseness, and professionalism while maintaining factual accuracy.'}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ]
      });

      const outputText = response.text?.trim() || '';
      if (outputText) {
        return res.json({ output: outputText });
      }
    }
    throw new Error('AI client returned empty response or unconfigured');
  } catch (error: any) {
    console.warn('Gemini API notice, using deterministic format fallback:', error?.message);
    // Strict rule-abiding deterministic fallback preserving original meaning
    const fallbackText = formatFallbackOutput(trimmedDesc, outputFormat, customFormat);
    res.json({ output: fallbackText });
  }
});

// 11. AI Smart Tag Generator (In-App)
app.post('/api/ai/generate-tags', async (req: Request, res: Response) => {
  const { description, format, customFormat, language } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Description is required to generate tags' });
  }

  const trimmedDesc = description.trim();

  // Helper: extract meaningful keywords strictly from description
  const extractKeywordsFromDescription = (text: string): string[] => {
    const stopwords = new Set([
      'the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'your', 'have', 
      'are', 'was', 'were', 'will', 'been', 'about', 'each', 'more', 'some', 'only',
      'when', 'what', 'where', 'which', 'their', 'there', 'here', 'file', 'image'
    ]);
    const words = text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9_\-\s]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 2 && !stopwords.has(w));

    // Deduplicate preserving order
    const unique = Array.from(new Set(words));
    // Determine reasonable tag count based on length (between 3 and 10 tags)
    const count = Math.min(Math.max(3, Math.ceil(unique.length / 2)), 10);
    return unique.slice(0, count);
  };

  try {
    if (aiClient) {
      const systemPrompt = `You are a precision tagging engine for Raj Expo Digitals.
Task: Generate relevant, unique tags based strictly on the supplied description. Determine the appropriate number of tags according to the description's content, topic, and complexity. Follow the selected output format (${format || 'Comma-Separated'}) and language (${language || 'English'}). Return only the tags without headings or explanations. Never invent facts or add unrelated or repetitive tags.
${STRICT_OUTPUT_RULE}

Format guidelines:
- If Comma-Separated: tags separated by commas, e.g. "digital, print, expo, server"
- If Hashtags: each tag starts with #, e.g. "#digital #print #expo #server"
- If One Tag Per Line: each tag on a separate line
- If JSON Array: valid JSON array of strings, e.g. ["digital", "print", "expo", "server"]
- If Custom Format: follow: ${customFormat || 'comma separated'}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nSupplied Description:\n${trimmedDesc}` }] }
        ]
      });

      const rawOutput = response.text?.trim() || '';
      if (rawOutput) {
        let parsedTags: string[] = [];
        if (format === 'JSON Array') {
          try {
            const cleaned = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedTags = JSON.parse(cleaned);
          } catch {
            parsedTags = rawOutput.split(/[\n,]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
          }
        } else if (format === 'Hashtags') {
          parsedTags = rawOutput.match(/#[a-zA-Z0-9_\-]+/g)?.map(t => t.replace(/^#/, '').toLowerCase()) || 
            rawOutput.split(/\s+/).map(t => t.replace(/^#/, '').trim().toLowerCase()).filter(Boolean);
        } else if (format === 'One Tag Per Line') {
          parsedTags = rawOutput.split(/\r?\n/).map(t => t.trim().toLowerCase()).filter(Boolean);
        } else {
          parsedTags = rawOutput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        }

        return res.json({ rawOutput, tags: parsedTags });
      }
    }
    throw new Error('AI client returned empty response or unconfigured');
  } catch (error: any) {
    console.warn('Gemini API notice, using deterministic tag extraction fallback:', error?.message);
    const keywords = extractKeywordsFromDescription(trimmedDesc);
    let rawOutput = '';
    switch (format) {
      case 'Hashtags':
        rawOutput = keywords.map(k => `#${k.replace(/\s+/g, '_')}`).join(' ');
        break;
      case 'One Tag Per Line':
        rawOutput = keywords.join('\n');
        break;
      case 'JSON Array':
        rawOutput = JSON.stringify(keywords, null, 2);
        break;
      case 'Custom Format':
        if (customFormat && customFormat.includes('{tag}')) {
          rawOutput = keywords.map(k => customFormat.replace(/\{tag\}/g, k)).join('\n');
        } else {
          rawOutput = keywords.join(customFormat || ', ');
        }
        break;
      case 'Comma-Separated':
      default:
        rawOutput = keywords.join(', ');
        break;
    }
    res.json({ rawOutput, tags: keywords });
  }
});

// ==========================================
// VITE DEV SERVER OR STATIC PRODUCTION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[RAJ EXPO SERVER] Running on http://localhost:${port}`);
  });
}

startServer();
