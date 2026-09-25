import type { ReactNode } from 'react';

// Renders the small Markdown subset used in brand procedures (## headings,
// "-" and "1." lists, paragraphs, **bold**) as React elements. No HTML is
// injected, so procedure text can never execute markup.

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
  );
}

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'paragraph'; text: string };

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+\.\s+(.*)$/);
    const last = blocks.at(-1);
    if (heading) blocks.push({ kind: 'heading', text: heading[1] });
    else if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const text = (bullet ?? numbered)![1];
      if (last?.kind === 'list' && last.ordered === ordered) last.items.push(text);
      else blocks.push({ kind: 'list', ordered, items: [text] });
    } else if (last?.kind === 'paragraph') last.text += ` ${line}`;
    else blocks.push({ kind: 'paragraph', text: line });
  }
  return blocks;
}

export function ProcedureText({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-3 text-sm">
      {parse(markdown).map((block, index) => {
        if (block.kind === 'heading') {
          return (
            <h3 key={index} className="pt-2 font-semibold first:pt-0">
              {inline(block.text)}
            </h3>
          );
        }
        if (block.kind === 'list') {
          const List = block.ordered ? 'ol' : 'ul';
          return (
            <List key={index} className={`space-y-1.5 pl-5 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-muted`}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inline(item)}</li>
              ))}
            </List>
          );
        }
        return <p key={index}>{inline(block.text)}</p>;
      })}
    </div>
  );
}
