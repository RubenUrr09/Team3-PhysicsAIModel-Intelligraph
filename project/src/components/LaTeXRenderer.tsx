import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LaTeXRendererProps {
  text: string;
}

function LaTeXRenderer({ text }: LaTeXRendererProps) {
  // Split text into parts, preserving LaTeX expressions
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return (
    <div className="latex-renderer">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display math mode
          const math = part.slice(2, -2);
          return <BlockMath key={index} math={math} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math mode
          const math = part.slice(1, -1);
          return <InlineMath key={index} math={math} />;
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </div>
  );
}

export default LaTeXRenderer;