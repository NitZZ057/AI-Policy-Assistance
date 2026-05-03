import re
from dataclasses import dataclass


@dataclass(frozen=True)
class TextChunk:
    content: str
    token_count: int


class DocumentChunker:
    def chunk(
        self,
        text: str,
        *,
        target_words: int = 380,
        overlap_words: int = 60,
        min_words: int = 25,
    ) -> list[TextChunk]:
        normalized = self._normalize(text)

        if not normalized:
            return []

        paragraphs = self._paragraphs(normalized)
        chunks: list[TextChunk] = []
        current_words: list[str] = []

        for paragraph in paragraphs:
            paragraph_words = paragraph.split()

            if len(current_words) + len(paragraph_words) <= target_words:
                current_words.extend(paragraph_words)
                continue

            if current_words:
                chunks.append(self._make_chunk(current_words))

            overlap = current_words[-overlap_words:] if overlap_words > 0 else []
            current_words = overlap + paragraph_words

            while len(current_words) > target_words:
                slice_words = current_words[:target_words]
                chunks.append(self._make_chunk(slice_words))
                current_words = current_words[target_words - overlap_words :]

        if len(current_words) >= min_words or not chunks:
            chunks.append(self._make_chunk(current_words))

        return chunks

    def _normalize(self, text: str) -> str:
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)

        return text.strip()

    def _paragraphs(self, text: str) -> list[str]:
        return [
            re.sub(r"\s+", " ", paragraph).strip()
            for paragraph in text.split("\n\n")
            if paragraph.strip()
        ]

    def _make_chunk(self, words: list[str]) -> TextChunk:
        content = " ".join(words).strip()

        return TextChunk(
            content=content,
            token_count=max(1, int(len(words) * 1.33)),
        )
