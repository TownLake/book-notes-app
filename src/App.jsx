// book-notes-app/src/App.jsx
import { useState } from 'react';
import BookForm from './components/BookForm';
import MarkdownPreview from './components/MarkdownPreview';
import SpeedmasterTheme from './components/SpeedmasterTheme';

function App() {
  const [markdownContent, setMarkdownContent] = useState('');
  
  return (
    <SpeedmasterTheme>
      <div className="min-h-screen p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-speedmaster-dark">Book Notes Generator</h1>
        </header>
        
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <BookForm setMarkdownContent={setMarkdownContent} />
          </div>
          
          <div className="md:w-1/2">
            <MarkdownPreview markdownContent={markdownContent} />
          </div>
        </div>
      </div>
    </SpeedmasterTheme>
  );
}

export default App;