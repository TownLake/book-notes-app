// book-notes-app/src/components/BookForm.jsx
import { useState } from 'react';
import { generateMarkdown } from '../utils/generateMarkdown';

const BookForm = ({ setMarkdownContent }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    dateStarted: '',
    dateFinished: new Date().toISOString().split('T')[0],
    placesRead: 'Lisbon, Sintra',
    format: 'Paperback',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const markdown = generateMarkdown(formData);
    setMarkdownContent(markdown);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <h2 className="text-xl font-bold mb-6 text-speedmaster-dark">Book Details</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Book Title*
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g. Redshirts"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Author*
          </label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g. John Scalzi"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Started
            </label>
            <input
              type="date"
              name="dateStarted"
              value={formData.dateStarted}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Finished*
            </label>
            <input
              type="date"
              name="dateFinished"
              value={formData.dateFinished}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Places Read
          </label>
          <input
            type="text"
            name="placesRead"
            value={formData.placesRead}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g. Lisbon, Sintra"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            name="format"
            value={formData.format}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="Paperback">Paperback</option>
            <option value="Hardcover">Hardcover</option>
            <option value="Kindle">Kindle</option>
            <option value="iPhone (Kindle App)">iPhone (Kindle App)</option>
            <option value="Audible">Audible</option>
          </select>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-2 px-4 bg-speedmaster-accent text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            Generate Markdown
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;