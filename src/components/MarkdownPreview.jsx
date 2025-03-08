// book-notes-app/src/components/MarkdownPreview.jsx
import { useRef, useState } from 'react';
import copy from 'clipboard-copy';

const MarkdownPreview = ({ markdownContent }) => {
  const textAreaRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!markdownContent) return;
    
    copy(markdownContent)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  if (!markdownContent) {
    return (
      <div className="bg-gray-900 p-6 rounded-lg shadow-md h-full flex items-center justify-center text-gray-400">
        <p className="text-center">
          Enter book details and generate markdown
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-200">Markdown</h2>
        <button
          onClick={handleCopy}
          className="px-4 py-1 bg-gray-700 text-gray-200 text-sm rounded-md hover:bg-gray-600 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      <div className="relative flex-grow">
        <textarea
          ref={textAreaRef}
          readOnly
          value={markdownContent}
          onClick={handleCopy}
          className="w-full h-full min-h-[450px] p-4 bg-gray-800 text-gray-100 font-mono text-sm rounded-md cursor-pointer border border-gray-700 resize-none focus:outline-none focus:border-gray-600"
          style={{ caretColor: 'transparent' }}
        />
      </div>
    </div>
  );
};

export default MarkdownPreview;