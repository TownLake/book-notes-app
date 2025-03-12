// book-notes-app/src/components/BookForm.jsx
import { useState } from 'react';
import { generateMarkdown, generateMarkdownWithMetadata } from '../utils/generateMarkdown';
import { findBookAndMetadata, fetchBookMetadata, findBookUrl } from '../services/bookService';
import LoadingSpinner from './LoadingSpinner';

const PREDEFINED_PLACES = ['Lisbon', 'Sintra'];

const BookForm = ({ setMarkdownContent }) => {
  const [formData, setFormData] = useState({
    title: '',
    dateStarted: '',
    dateFinished: new Date().toISOString().split('T')[0],
    placesRead: {
      predefined: [],
      custom: ''
    },
    format: 'Kindle',
    frontmatterDescription: '', // Renamed from description
    whyReadIt: '',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [metadataFetched, setMetadataFetched] = useState(false);
  const [fetchedMetadata, setFetchedMetadata] = useState(null);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'placesRead') {
      // Handle predefined places checkboxes
      setFormData(prev => ({
        ...prev,
        placesRead: {
          ...prev.placesRead,
          predefined: checked 
            ? [...prev.placesRead.predefined, value]
            : prev.placesRead.predefined.filter(place => place !== value)
        }
      }));
    } else if (name === 'placesReadCustom') {
      // Handle custom places input
      setFormData(prev => ({
        ...prev,
        placesRead: {
          ...prev.placesRead,
          custom: value
        }
      }));
    } else {
      // Handle other form fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Reset metadata fetched flag when user changes the title field
    if (name === 'title') {
      setMetadataFetched(false);
      setFetchedMetadata(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let metadata = fetchedMetadata;

      // Only fetch metadata if we haven't already or if it's changed
      if (!metadataFetched) {
        try {
          setLoadingMessage('Searching for book on Amazon...');
          const amazonUrl = await findBookUrl(
            formData.title,
            '', 
            formData.format || ''
          );
          console.log('Found Amazon URL:', amazonUrl);

          setLoadingMessage('Fetching book metadata from Amazon...');
          metadata = await fetchBookMetadata(amazonUrl);
          setFetchedMetadata(metadata);
          setMetadataFetched(true);
        } catch (searchError) {
          console.error('Error in search or metadata fetch:', searchError);
          setError(`Book search/metadata error: ${searchError.message}`);
          throw searchError;
        }
      }

      console.log('Using metadata:', metadata);
      setLoadingMessage('Generating markdown template...');

      // Combine predefined and custom places
      const placesRead = [
        ...formData.placesRead.predefined,
        ...(formData.placesRead.custom ? [formData.placesRead.custom] : [])
      ].join(', ');

      // Create a modified form data with combined places
      const modifiedFormData = {
        ...formData,
        placesRead
      };

      // Generate markdown with metadata, explicitly passing metadata title/author
      const markdown = await generateMarkdownWithMetadata(modifiedFormData, metadata);
      setMarkdownContent(markdown);
    } catch (error) {
      console.error('Error fetching book metadata:', error);

      // More detailed error message
      const errorMessage = `Failed to fetch book metadata: ${error.message}. Generating basic template instead.`;
      setError(errorMessage);

      // Combine predefined and custom places
      const placesRead = [
        ...formData.placesRead.predefined,
        ...(formData.placesRead.custom ? [formData.placesRead.custom] : [])
      ].join(', ');

      // Create a modified form data with combined places
      const modifiedFormData = {
        ...formData,
        placesRead
      };

      // Fallback to basic template
      const basicMarkdown = generateMarkdown(modifiedFormData);
      setMarkdownContent(basicMarkdown);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Helper to show what title/author will be used
  const displayTitle = metadataFetched && fetchedMetadata?.title !== 'Not found' 
    ? fetchedMetadata.title 
    : formData.title;
    
  const displayAuthor = metadataFetched && fetchedMetadata?.author !== 'Not found' 
    ? fetchedMetadata.author 
    : '';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <h2 className="text-xl font-bold mb-6 text-speedmaster-dark">Book Details</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Book 
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="e.g. The Great Gatsby F Scott Fitzgerald"
          />
          {metadataFetched && (
            <div className="mt-1 text-sm text-green-600">
              <span className="font-medium">Title from Amazon:</span> {displayTitle}
              {displayAuthor && <span> by {displayAuthor}</span>}
            </div>
          )}
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
          <div className="mb-2">
            {PREDEFINED_PLACES.map(place => (
              <label key={place} className="inline-flex items-center mr-4 mb-2">
                <input
                  type="checkbox"
                  name="placesRead"
                  value={place}
                  checked={formData.placesRead.predefined.includes(place)}
                  onChange={handleChange}
                  className="form-checkbox h-4 w-4 text-speedmaster-accent"
                />
                <span className="ml-2">{place}</span>
              </label>
            ))}
          </div>
          <input
            type="text"
            name="placesReadCustom"
            value={formData.placesRead.custom}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Other places"
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
            <option value="Kindle">Kindle</option>
            <option value="Paperback">Paperback</option>
            <option value="Hardcover">Hardcover</option>
            <option value="iPhone (Kindle App)">iPhone (Kindle App)</option>
            <option value="Audible">Audible</option>
          </select>
        </div>

        {/* Expandable Notes Section */}
        <div>
          <div 
            className="flex items-center cursor-pointer mb-2"
            onClick={() => setIsNotesExpanded(!isNotesExpanded)}
          >
            <span className="font-medium text-sm text-gray-700">
              Write Notes {isNotesExpanded ? '▼' : '▶'}
            </span>
          </div>
          
          {isNotesExpanded && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Front Matter)
                </label>
                <textarea
                  name="frontmatterDescription"
                  value={formData.frontmatterDescription}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Short description for the front matter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why Did I Read It?
                </label>
                <textarea
                  name="whyReadIt"
                  value={formData.whyReadIt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Your reasons for reading this book"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (No Spoilers)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="5"
                  placeholder="Your thoughts and notes about the book (no spoilers)"
                />
              </div>
            </div>
          )}
        </div>

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