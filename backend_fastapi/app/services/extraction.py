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

        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                pages.append(text.strip())

        return "\n\n".join(pages).strip()

    def _extract_text(self, path: Path) -> str:
        return path.read_text(encoding="utf-8", errors="ignore").strip()
