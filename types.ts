export type FileType = 'pdf' | 'pptx' | 'xlsx' | 'docx' | 'image' | 'folder' | 'gdoc' | 'gsheet' | 'gform';

export interface InnerFileData {
  name: string;
  count: number;
  type: FileType;
  portraitCount: number;
  landscapeCount: number;
}

export interface DocFileData {
  id: string;
  name: string;
  file?: File; // Optional if loading from Drive
  driveFileId?: string; // Set if from Drive
  type: FileType;
  count: number; // Pages, Slides, Sheets, or Images
  portraitCount: number; // Mainly for PDF
  landscapeCount: number; // Mainly for PDF
  sheetCount: number; // Physical paper sheets for 2-sided printing
  singleSidedPrice: number;
  doubleSidedPrice: number;
  innerFiles?: InnerFileData[]; // Scan listing for folder imports
}

export type ViewMode = 'list' | 'card';

// Drive Mirror Node Structure
export interface DriveNode {
  id: string;
  name: string;
  mimeType: string;
  type: FileType;
  parentId?: string;
  indexNumber?: number; // Auto-indexing folders numerically
  pageCount?: number;
  sheetCount?: number;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

// Global Cart/Selection Item
export interface CartItem {
  id: string; // driveFileId or local file id
  name: string;
  folderPath: string; // Path hierarchy (e.g. "O Level/Physics/2023")
  pageCount: number;
  sheetCount: number;
  singleSidedPrice: number;
  doubleSidedPrice: number;
  type: FileType;
  checked: boolean;
}

// Contacts
export interface GoogleContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

// Tasks
export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

// Calendar Events
export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

// Gmail Message representation
export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  labelIds?: string[];
}

export interface TotalsData {
  totalCount: number;
  totalOneSidedCount: number;
  totalPortraitCount: number;
  totalLandscapeCount: number;
  totalSheets: number;
  totalSingleSidedPrice: number;
  totalDoubleSidedPrice: number;
}

