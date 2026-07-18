import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_PAGES = 80;
const MAX_SOURCE_CHARACTERS = 12_000;

function cleanPdfText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Choose a PDF file first." },
        { status: 400 },
      );
    }
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return Response.json(
        { error: "This endpoint only accepts PDF files." },
        { status: 415 },
      );
    }
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      return Response.json(
        { error: "Keep PDFs under 4 MB for the live demo." },
        { status: 413 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(bytes);
    if (pdf.numPages > MAX_PAGES) {
      return Response.json(
        { error: `Keep PDFs under ${MAX_PAGES} pages for the live demo.` },
        { status: 413 },
      );
    }

    const extracted = await extractText(pdf, { mergePages: true });
    const text = cleanPdfText(extracted.text);
    if (text.length < 200) {
      return Response.json(
        {
          error:
            "We could not find enough selectable text. Scanned PDFs need OCR and are not supported yet.",
        },
        { status: 422 },
      );
    }

    return Response.json({
      text: text.slice(0, MAX_SOURCE_CHARACTERS),
      pages: extracted.totalPages,
      characters: text.length,
      truncated: text.length > MAX_SOURCE_CHARACTERS,
    });
  } catch (error) {
    console.error("PDF extraction failed", error);
    return Response.json(
      {
        error:
          "We could not read this PDF. It may be encrypted, damaged, or image-only.",
      },
      { status: 422 },
    );
  }
}
