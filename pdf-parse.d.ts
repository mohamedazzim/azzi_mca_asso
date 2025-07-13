declare module 'pdf-parse' {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }
  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: any
  ): Promise<PDFParseResult>;
  export = pdfParse;
} 