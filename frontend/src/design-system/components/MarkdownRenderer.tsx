import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components, ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/design-system/components';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const isAsciiDiagram = (text: string): boolean => {
  const lines = text.split('\n');
  if (lines.length < 2) return false;
  const patterns = [/[│├└┌┐┘┬┴┼─]/, /^\s*[/\\|]\s*$/, /^\s*\/\s*\\\s*$/, /^\s*\d+\s*$/];
  let matches = 0;
  for (const line of lines) {
    if (patterns.some(p => p.test(line)) || (line.trim().length < 10 && /^\s+/.test(line))) matches++;
  }
  return matches / lines.length > 0.4;
};

const CodeBlock = memo(({ className, children }: React.ComponentPropsWithoutRef<'code'> & ExtraProps) => {
  const [copied, setCopied] = React.useState(false);
  const lang = /language-(\w+)/.exec(className || '')?.[1] || '';
  const code = String(children).replace(/\n$/, '');

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lang && isAsciiDiagram(code)) {
    return (
      <div className="my-5 rounded-md bg-[#161b22] border border-white/[0.06]">
        <pre className="p-4 overflow-x-auto m-0">
          <code className="font-mono text-[13px] leading-[1.9] text-[#8b949e] whitespace-pre block">{code}</code>
        </pre>
      </div>
    );
  }

  if (lang) {
    return (
      <div className="group relative my-5 rounded-md overflow-hidden border border-white/[0.06] bg-[#0d1117]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.04]">
          <span className="text-[10px] uppercase tracking-wider font-medium text-white/30 select-none">{lang}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copy}
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-white/30 hover:text-white/60"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={lang}
          PreTag="div"
          customStyle={{ margin: 0, padding: '0.875rem 1rem', background: 'transparent', fontSize: '13px', lineHeight: '1.55' }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <div className="my-5 rounded-md bg-[#0d1117] border border-white/[0.06]">
      <pre className="p-4 overflow-x-auto m-0">
        <code className="font-mono text-[13px] leading-[1.55] text-[#c9d1d9] block">{code}</code>
      </pre>
    </div>
  );
});
CodeBlock.displayName = 'CodeBlock';

const InlineCode = ({ children, ...props }: React.ComponentPropsWithoutRef<'code'>) => (
  <code className="text-[#e6e6e6] bg-white/[0.06] px-[5px] py-[1px] rounded text-[0.875em] font-mono" {...props}>
    {children}
  </code>
);

export const MarkdownRenderer = memo(({ content, className }: MarkdownRendererProps) => {
  const components: Components = {
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children, ...props }) => {
      const isBlock = className?.includes('language-') || String(children).includes('\n');
      return isBlock ? <CodeBlock className={className} {...props}>{children}</CodeBlock> : <InlineCode {...props}>{children}</InlineCode>;
    },
    a: (props) => <a target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-2" {...props} />,
    h1: (props) => <h1 className="text-[1.6rem] font-semibold text-white mt-0 mb-5 leading-tight tracking-[-0.01em]" {...props} />,
    h2: (props) => <h2 className="text-[1.2rem] font-semibold text-white mt-9 mb-3 pb-2 border-b border-white/[0.06] leading-snug" {...props} />,
    h3: (props) => <h3 className="text-[1.05rem] font-medium text-white/95 mt-7 mb-2 leading-snug" {...props} />,
    h4: (props) => <h4 className="text-[0.95rem] font-medium text-white/90 mt-5 mb-2" {...props} />,
    p: (props) => <p className="text-[#a1a1aa] leading-[1.7] mb-4 last:mb-0" {...props} />,
    strong: ({ children, ...props }) => {
      const isKeyword = /^(example|input|output|explanation|note|constraints?|follow[- ]?up)s?:?$/i.test(String(children).trim());
      return isKeyword
        ? <strong className="text-white/90 font-semibold text-[0.75rem] uppercase tracking-wide block mt-5 mb-1.5 first:mt-0" {...props}>{children}</strong>
        : <strong className="text-white/90 font-medium" {...props}>{children}</strong>;
    },
    em: (props) => <em className="text-white/70 italic" {...props} />,
    ul: (props) => <ul className="my-3 ml-4 list-disc marker:text-white/20 space-y-1" {...props} />,
    ol: (props) => <ol className="my-3 ml-4 list-decimal marker:text-white/30 space-y-1" {...props} />,
    li: (props) => <li className="text-[#a1a1aa] leading-[1.65] pl-1" {...props} />,
    blockquote: (props) => <blockquote className="my-4 border-l-2 border-white/10 pl-4 text-white/60 italic" {...props} />,
    table: (props) => <div className="my-5 overflow-x-auto rounded border border-white/[0.06]"><table className="w-full text-[13px]" {...props} /></div>,
    thead: (props) => <thead className="bg-white/[0.03] text-white/70 font-medium" {...props} />,
    tbody: (props) => <tbody className="divide-y divide-white/[0.04]" {...props} />,
    tr: (props) => <tr className="hover:bg-white/[0.02]" {...props} />,
    th: (props) => <th className="px-3 py-2 text-left font-medium" {...props} />,
    td: (props) => <td className="px-3 py-2 text-[#a1a1aa]" {...props} />,
    hr: (props) => <hr className="my-6 border-0 h-px bg-white/[0.06]" {...props} />,
  };

  return (
    <div className={cn('markdown-renderer text-sm', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
