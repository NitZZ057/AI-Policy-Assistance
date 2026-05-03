export function renderMarkdownLite(value = "") {
  const blocks = splitBlocks(value);

  return blocks.map((block, index) => {
    if (isOrderedList(block)) {
      return (
        <ol key={`block-${index}`}>
          {block.map((line) => (
            <li key={line}>{renderInline(line.replace(/^\d+\.\s+/, ""))}</li>
          ))}
        </ol>
      );
    }

    if (isUnorderedList(block)) {
      return (
        <ul key={`block-${index}`}>
          {block.map((line) => (
            <li key={line}>{renderInline(line.replace(/^[-*]\s+/, ""))}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`block-${index}`}>
        {block.map((line, lineIndex) => (
          <span key={`${line}-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {renderInline(line)}
          </span>
        ))}
      </p>
    );
  });
}

function splitBlocks(value) {
  return value
    .trim()
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((block) => block.length > 0);
}

function isOrderedList(block) {
  return block.every((line) => /^\d+\.\s+/.test(line));
}

function isUnorderedList(block) {
  return block.every((line) => /^[-*]\s+/.test(line));
}

function renderInline(value) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}
