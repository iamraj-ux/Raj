// This tells TypeScript that `pdfjsLib` is available on the global scope.
declare const pdfjsLib: any;

export interface PageCounts {
  total: number;
  portrait: number;
  landscape: number;
}

/**
 * Counts the total, portrait, and landscape pages in a given PDF file.
 * @param file The PDF file object.
 * @returns A promise that resolves with an object containing page counts.
 */
export const countPdfPages = async (file: File): Promise<PageCounts> => {
  if (file.size === 0) {
    throw new Error("Error parsing PDF:\nThe PDF file is empty, i.e. its size is zero bytes.");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        try {
          const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
          const pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;
          
          let portrait = 0;
          let landscape = 0;

          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
            if (viewport.width > viewport.height) {
              landscape++;
            } else {
              portrait++;
            }
          }

          resolve({ total: pdfDoc.numPages, portrait, landscape });
        } catch (error: any) {
          console.error("Error parsing PDF:", error);
          if (error.name === 'PasswordException') {
            reject(new Error("File is password-protected and cannot be read."));
          } else if (error.name === 'InvalidPDFException') {
            reject(new Error("File is not a valid or is a corrupted PDF."));
          } else {
            reject(new Error("Failed to parse the PDF file. It might be malformed."));
          }
        }
      } else {
        reject(new Error("Failed to read the file."));
      }
    };

    reader.onerror = () => {
      reader.abort();
      reject(new Error("An error occurred while reading the file."));
    };

    reader.readAsArrayBuffer(file);
  });
};
