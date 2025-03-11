// book-notes-app/src/components/BookForm.jsx
import { useState } from 'react';
import { generateMarkdown, generateMarkdownWithMetadata } from '../utils/generateMarkdown';
import { findBookAndMetadata, fetchBookMetadata, findBookUrl } from '../services/bookService';
import LoadingSpinner from './LoadingSpinner';

const BookForm = ({ setMarkdownContent }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    dateStarted: '',
    dateFinished: new Date().toISOString().split('T')[0],
    placesRead: 'Lisbon, Sintra',
    format: 'Paperback',
    amazonUrl: '', // Optional direct Amazon URL
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [metadataFetched, setMetadataFetched] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Reset metadata fetched flag when user changes the title or author fields
    if (name === 'title' || name === 'author' || name === 'amazonUrl') {
      setMetadataFetched(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let metadata;

      // Check if we have a direct Amazon URL or need to search
      if (formData.amazonUrl) {
        setLoadingMessage('Fetching book metadata from Amazon...');
        try {
          metadata = await fetchBookMetadata(formData.amazonUrl);
          setMetadataFetched(true);
        } catch (metadataError) {
          console.error('Error fetching metadata directly:', metadataError);
          setError(`Metadata fetch error: ${metadataError.message}`);
          throw metadataError;
        }
      } else {
        try {
          setLoadingMessage('Searching for book on Amazon...');
          // Pass title, author and format to get more accurate results
          const amazonUrl = await findBookUrl(
            formData.title, 
            formData.author || '', 
            formData.format || ''
          );
          console.log('Found Amazon URL:', amazonUrl);

          setLoadingMessage('Fetching book metadata from Amazon...');
          metadata = await fetchBookMetadata(amazonUrl);
          setMetadataFetched(true);
        } catch (searchError) {
          console.error('Error in search or metadata fetch:', searchError);
          setError(`Book search/metadata error: ${searchError.message}`);
          throw searchError;
        }
      }

      console.log('Fetched metadata:', metadata);
      setLoadingMessage('Generating markdown template...');

      // Generate markdown with metadata
      const markdown = await generateMarkdownWithMetadata(formData, metadata);
      setMarkdownContent(markdown);
    } catch (error) {
      console.error('Error fetching book metadata:', error);

      // More detailed error message
      const errorMessage = `Failed to fetch book metadata: ${error.message}. Generating basic template instead.`;
      setError(errorMessage);

      // Fallback to basic template
      const basicMarkdown = generateMarkdown(formData);
      setMarkdownContent(basicMarkdown);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
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
            Author
          </label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g. John Scalzi (optional but recommended)"
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

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        {showAdvanced && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amazon URL (Optional - Direct Link)
            </label>
            <input
              type="text"
              name="amazonUrl"
              value={formData.amazonUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. https://www.amazon.com/dp/B087QB1DMD"
            />
            <p className="text-xs text-gray-500 mt-1">
              Directly provide an Amazon URL if automatic search doesn't find your book
            </p>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {isLoading ? (
          <LoadingSpinner message={loadingMessage} />
        ) : (
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-speedmaster-accent text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              Generate Markdown
            </button>
          </div>
        )}

        {metadataFetched && (
          <div className="text-green-600 text-sm font-medium text-center">
            ✅ Book metadata successfully fetched!
          </div>
        )}
      </form>
    </div>
  );
};

export default BookForm;