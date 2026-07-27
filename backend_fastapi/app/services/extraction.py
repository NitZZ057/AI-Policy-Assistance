from pathlib import Path

from pypdf import PdfReader


class DocumentTextExtractor:
    def extract(self, file_path: str, mime_type: str) -> str:
        path = Path(file_path)

        if mime_type == "application/pdf" or path.suffix.lower() == ".pdf":
            return self._extract_pdf(path)

        if mime_type.startswith("text/") or path.suffix.lower() == ".txt":
            return self._extract_text(path)

        raise ValueError("Unsupported document type. Upload a PDF or text file.")

    def _extract_pdf(self, path: Path) -> str:
        reader = PdfReader(str(path))
        pages: list[str] = []
        image_count = 0

        for page in reader.pages:
            text = page.extract_text() or ""

            if text.strip():
                pages.append(text.strip())
                continue

            # Track images so an image-based PDF can be told apart from an empty
            # one - pypdf reads a text layer, it does not run OCR.
            try:
                image_count += len(page.images)
            except Exception:  # noqa: BLE001 - malformed image xobjects are not fatal here
                pass

        extracted = "\n\n".join(pages).strip()

        if not extracted and image_count:
            raise ValueError(
                f"This is an image-based PDF - all {len(reader.pages)} page(s) are "
                "scanned images with no selectable text. Text extraction needs a "
                "text-based PDF, so upload one exported from a document editor, or a .txt file."
            )

        return extracted

    def _extract_text(self, path: Path) -> str:
        return path.read_text(encoding="utf-8", errors="ignore").strip()
