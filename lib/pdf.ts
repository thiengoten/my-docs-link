import path from "node:path";

// pdf-parse (pdfjs-dist) resolves its worker script relative to its own
// module location, which breaks once Next.js bundles the server code into
// a different directory. Point it at the real file on disk instead.
let workerConfigured = false;

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");

  if (!workerConfigured) {
    PDFParse.setWorker(
      path.join(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs")
    );
    workerConfigured = true;
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
