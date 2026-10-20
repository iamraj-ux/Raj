declare const JSZip: any;

export interface OfficeCounts {
  total: number;
}

/**
 * Counts the slides in a PowerPoint file (.pptx).
 */
export const countPptxSlides = async (file: File): Promise<OfficeCounts> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const zip = await JSZip.loadAsync(event.target?.result);
        const appXmlFile = zip.file("docProps/app.xml");
        if (appXmlFile) {
          const xmlText = await appXmlFile.async("text");
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const slidesNode = xmlDoc.getElementsByTagName("Slides")[0];
          if (slidesNode && slidesNode.textContent) {
             const count = parseInt(slidesNode.textContent, 10);
             if (!isNaN(count) && count > 0) return resolve({ total: count });
          }
        }
        let slideCount = 0;
        zip.folder("ppt/slides")?.forEach((path) => { if (path.endsWith(".xml")) slideCount++; });
        resolve({ total: slideCount || 1 });
      } catch (err) { reject(new Error("Failed to parse PowerPoint file.")); }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Counts the worksheets in an Excel file (.xlsx).
 */
export const countExcelSheets = async (file: File): Promise<OfficeCounts> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const zip = await JSZip.loadAsync(event.target?.result);
        const workbookXml = zip.file("xl/workbook.xml");
        if (!workbookXml) throw new Error("Invalid structure.");
        const xmlText = await workbookXml.async("text");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const sheets = xmlDoc.getElementsByTagName("sheet");
        resolve({ total: sheets.length || 1 });
      } catch (err) { reject(new Error("Failed to parse Excel file.")); }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Counts the pages in a Word file (.docx).
 */
export const countDocxPages = async (file: File): Promise<OfficeCounts> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const zip = await JSZip.loadAsync(event.target?.result);
        const appXmlFile = zip.file("docProps/app.xml");
        if (appXmlFile) {
          const xmlText = await appXmlFile.async("text");
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const pagesNode = xmlDoc.getElementsByTagName("Pages")[0];
          if (pagesNode && pagesNode.textContent) {
            const count = parseInt(pagesNode.textContent, 10);
            return resolve({ total: count > 0 ? count : 1 });
          }
        }
        resolve({ total: 1 });
      } catch (err) { reject(new Error("Failed to parse Word file.")); }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
};