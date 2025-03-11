// book-notes-app/src/services/bookService.js
const BOOK_FINDER_API = 'https://book-finder.samrhea.workers.dev';
const AMAZON_SCRAPER_API = 'https://amazon-product-scraper.samrhea.workers.dev';

/**
 * Most basic fetch function possible to avoid triggering CORS preflight
 * @param {string} url - URL to fetch
 * @returns {Promise<any>} - Response data
 */
const simpleFetch = async (url) => {
  try {
    console.log(`Fetching: ${url}`);
    
    // Absolutely minimal fetch - no custom headers, no options that trigger preflight
    const response = await fetch(url);
    
    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    // Parse JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Make sure CORS is enabled on the workers');
    }
    
    throw error;
  }
};

/**
 * Finds a book's Amazon URL based on title and optional author and format
 * @param {string} title - Book title
 * @param {string} author - Optional author name
 * @param {string} format - Optional format (Kindle, Paperback, etc.)
 * @returns {Promise<string>} - Amazon URL for the book
 */
export const findBookUrl = async (title, author = '', format = '') => {
  try {
    // Construct query with title, author, and format if provided
    let query = title;
    if (author) query += ` ${author}`;
    if (format) query += ` ${format}`;
    
    const url = `${BOOK_FINDER_API}/search?query=${encodeURIComponent(query)}&store=amazon`;
    console.log('Calling BookFinder API:', url);
    
    const data = await simpleFetch(url);
    console.log('BookFinder API response data:', data);
    
    if (data.error) {
      throw new Error(`BookFinder API returned error: ${data.error}`);
    }
    
    if (!data.bookLink || !data.bookLink.url) {
      throw new Error('BookFinder API returned invalid data structure: missing bookLink.url');
    }
    
    return data.bookLink.url;
  } catch (error) {
    console.error('Error finding book URL:', error);
    throw error;
  }
};

/**
 * Fetches book metadata from an Amazon URL
 * @param {string} amazonUrl - Amazon product URL
 * @returns {Promise<Object>} - Book metadata
 */
export const fetchBookMetadata = async (amazonUrl) => {
  try {
    const url = `${AMAZON_SCRAPER_API}/scrape?url=${encodeURIComponent(amazonUrl)}`;
    console.log('Calling Amazon Scraper API:', url);

    const data = await simpleFetch(url);
    console.log('Amazon Scraper API response data:', data);

    if (data.error) {
      throw new Error(`Amazon Scraper API returned error: ${data.error}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching book metadata:', error);
    throw error;
  }
};

/**
 * Complete workflow to find a book and fetch its metadata
 * @param {string} title - Book title
 * @param {string} author - Optional author name
 * @param {string} format - Optional format (Kindle, Paperback, etc.)
 * @returns {Promise<Object>} - Book metadata
 */
export const findBookAndMetadata = async (title, author = '', format = '') => {
  try {
    // Step 1: Get Amazon URL for the book
    const amazonUrl = await findBookUrl(title, author, format);
    console.log('Found Amazon URL:', amazonUrl);
    
    // Step 2: Use the URL to fetch metadata
    const metadata = await fetchBookMetadata(amazonUrl);
    
    return metadata;
  } catch (error) {
    console.error('Error in complete book lookup workflow:', error);
    throw error;
  }
};