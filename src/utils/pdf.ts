import PDFDocument from "pdfkit";

export interface PdfSection {
  title: string;
  lines: string[];
}

export const buildPdfBuffer = (reportTitle: string, sections: PdfSection[]) => {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on("error", (error) => {
        reject(error);
      });

      doc.fontSize(20).text(reportTitle, { align: "center" });
      doc.moveDown();
      doc.fontSize(10).fillColor("#555555").text(`Generated on ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(2);

      for (const section of sections) {
        doc.fillColor("#000000").fontSize(14).text(section.title, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        for (const line of section.lines) {
          doc.text(line);
        }
        doc.moveDown();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
