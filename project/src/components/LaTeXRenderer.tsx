import React, { useEffect, useRef } from 'react';

interface LaTeXRendererProps {
  text: string;
  renderKey?: number; // Add a key prop to force re-renders
}

const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ text, renderKey }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear any previous MathJax rendering in this element
    if (contentRef.current && window.MathJax && window.MathJax.typesetClear) {
      window.MathJax.typesetClear([contentRef.current]);
    }

    // Function to handle MathJax rendering
    const renderMathJax = async () => {
      if (!text || !contentRef.current) return;
      
      if (typeof window !== 'undefined' && window.MathJax) {
        try {
          // Force reset MathJax's internal state for this element
          if (window.MathJax.typesetClear) {
            window.MathJax.typesetClear([contentRef.current]);
          }
          
          // Process the current element
          await window.MathJax.typesetPromise([contentRef.current]);
        } catch (error) {
          console.error('MathJax rendering error:', error);
        }
      } else {
        console.log('Loading MathJax script...');
        // If MathJax isn't loaded, load it
        await loadMathJaxScript();
        
        // Configure MathJax
        window.MathJax = {
          tex: {
            inlineMath: [['\(', '\)']],
            displayMath: [['\[', '\]']]
          },
          svg: {
            fontCache: 'global'
          },
          startup: {
            typeset: false
          }
        };
        
        // Wait a bit for MathJax to initialize
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Try to render
        try {
          if (contentRef.current) {
            await window.MathJax.typesetPromise([contentRef.current]);
          }
        } catch (error) {
          console.error('MathJax initialization error:', error);
        }
      }
    };

    // Load MathJax script
    const loadMathJaxScript = (): Promise<void> => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js';
        script.async = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    // Set a slight delay to ensure the DOM is ready
    const timeoutId = setTimeout(() => {
      renderMathJax();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, renderKey]); // Re-trigger when text or renderKey changes

  // Process bold text using ** syntax
  const processBoldText = (text: string): JSX.Element[] => {
    // Split by ** markers
    const parts = text.split(/(\*\*.*?\*\*)/);
    
    return parts.map((part, index) => {
      // Check if this part is bold (surrounded by **)
      if (part.startsWith('**') && part.endsWith('**')) {
        // Extract text between ** markers
        const boldText = part.slice(2, -2);
        return <strong key={index}>{boldText}</strong>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  // Process text to handle markdown headers, line breaks and paragraphs
  const formatText = (inputText: string) => {
    // Split into paragraphs
    const paragraphs = inputText.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // Check if paragraph is a header (starts with # or ##)
      if (paragraph.trim().startsWith('# ')) {
        // H1 header
        const headerText = paragraph.trim().substring(2);
        return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{processBoldText(headerText)}</h1>;
      } else if (paragraph.trim().startsWith('## ')) {
        // H2 header
        const headerText = paragraph.trim().substring(3);
        return <h2 key={index} className="text-xl font-bold mt-3 mb-2">{processBoldText(headerText)}</h2>;
      } else if (paragraph.trim().startsWith('### ')) {
        // H3 header
        const headerText = paragraph.trim().substring(4);
        return <h3 key={index} className="text-lg font-bold mt-3 mb-1">{processBoldText(headerText)}</h3>;
      } else if (paragraph.trim().startsWith('#### ')) {
        // H4 header
        const headerText = paragraph.trim().substring(5);
        return <h4 key={index} className="text-base font-bold mt-2 mb-1">{processBoldText(headerText)}</h4>;
      } else {
        // Regular paragraph with potential bold formatting
        return (
          <p key={index} className="mb-4">
            {paragraph.split('\n').map((line, i) => {
              // Check if line is a header (but not at start of paragraph)
              if (line.trim().startsWith('# ') && i > 0) {
                const headerText = line.trim().substring(2);
                return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{processBoldText(headerText)}</h1>;
              } else if (line.trim().startsWith('## ') && i > 0) {
                const headerText = line.trim().substring(3);
                return <h2 key={i} className="text-xl font-bold mt-3 mb-2">{processBoldText(headerText)}</h2>;
              } else if (line.trim().startsWith('### ') && i > 0) {
                const headerText = line.trim().substring(4);
                return <h3 key={i} className="text-lg font-bold mt-3 mb-1">{processBoldText(headerText)}</h3>;
              } else if (line.trim().startsWith('#### ') && i > 0) {
                const headerText = line.trim().substring(5);
                return <h4 key={i} className="text-base font-bold mt-2 mb-1">{processBoldText(headerText)}</h4>;
              } else {
                return (
                  <React.Fragment key={i}>
                    {processBoldText(line)}
                    {i < paragraph.split('\n').length - 1 && <br />}
                  </React.Fragment>
                );
              }
            })}
          </p>
        );
      }
    });
  };

  // Process code blocks
  const processCodeBlocks = (inputText: string) => {
    // Split by code block markers
    const parts = inputText.split('```');
    
    if (parts.length <= 1) {
      // No code blocks, just format as normal
      return formatText(inputText);
    }
    
    // Process alternating text and code blocks
    return parts.map((part, index) => {
      if (index % 2 === 0) {
        // Regular text
        return formatText(part);
      } else {
        // Code block
        // Check if there's a language specifier in the first line
        const lines = part.split('\n');
        const language = lines[0].trim();
        const code = lines.slice(1).join('\n');
        
        return (
          <pre key={`code-${index}`} className="bg-gray-100 p-4 rounded-md my-4 overflow-x-auto">
            <code className={`language-${language}`}>
              {code}
            </code>
          </pre>
        );
      }
    });
  };

  return (
    <div 
      ref={contentRef}
      className="latex-content text-gray-800"
    >
      {processCodeBlocks(text)}
    </div>
  );
};

// Add MathJax to window type
declare global {
  interface Window {
    MathJax: any;
  }
}

export default LaTeXRenderer;