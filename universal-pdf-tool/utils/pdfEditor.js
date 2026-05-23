import { PDFDocument } from 'pdf-lib';

/**
 * Merge multiple PDF files into a single PDF.
 * @param {File[]} fileArray - Array of PDF File objects
 * @returns {Promise<Blob>} - The merged PDF as a Blob
 */
export async function mergePdfs(fileArray) {
  try {
    // Naya khali PDF document banayen
    const mergedPdf = await PDFDocument.create();

    // Har ek upload ki gayi file par loop chalayen
    for (const file of fileArray) {
      const fileBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(fileBuffer);
      
      // Original PDF ke saare pages copy karein
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      // Naye PDF me pages add karein
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    // Naye document ko save karein
    const mergedPdfBytes = await mergedPdf.save();
    
    // Blob format me return karein taki user download kar sake
    return new Blob([mergedPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error("Error merging PDFs:", error);
    throw new Error("Failed to merge PDFs. Please ensure all files are valid PDF documents.");
  }
}

/**
 * Extract specific pages from a PDF to create a new PDF.
 * @param {File} file - The original PDF File object
 * @param {number[]} pageIndices - Array of 0-based page numbers to extract (e.g., [0, 2] for 1st and 3rd page)
 * @returns {Promise<Blob>} - The new split PDF as a Blob
 */
export async function splitPdf(file, pageIndices = [0]) {
  try {
    const fileBuffer = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(fileBuffer);
    const newPdf = await PDFDocument.create();

    // Sirf wahi pages copy karein jo user ne select kiye hain
    const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
    
    copiedPages.forEach((page) => {
      newPdf.addPage(page);
    });

    const newPdfBytes = await newPdf.save();
    return new Blob([newPdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error("Error splitting PDF:", error);
    throw new Error("Failed to split PDF. Please check the page numbers.");
  }
}
