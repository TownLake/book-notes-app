// book-notes-app/src/services/bookService.js
const BOOK_FINDER_API = 'https://book-finder.samrhea.workers.dev';
const AMAZON_SCRAPER_API = 'https://amazon-product-scraper.samrhea.workers.dev';
const EMOJI_GENERATOR_API = 'https://emoji-generator.samrhea.workers.dev';

// Service token credentials from environment variables
// For Vite, use import.meta.env instead of process.env
const CF_ACCESS_CLIENT_ID = import.meta.env.VITE_CF_ACCESS_CLIENT_ID || '';
const CF_ACCESS_CLIENT_SECRET = import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET || '';

console.log('ENV Variables Check:', {
  clientIdExists: Boolean(import.meta.env.VITE_CF_ACCESS_CLIENT_ID),
  secretExists: Boolean(import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET),
});

/**
 * Fetch function for GET requests with Cloudflare Access authentication
 * @param {string} url - URL to fetch
 * @returns {Promise<any>} - Response data
 */
const simpleFetch = async (url) => {
  try {
    console.log(`[bookService] GET Fetching: ${url}`);
    
    // Add Cloudflare Access service token authentication
    const response = await fetch(url, {
      credentials: 'include', // Important for cookie-based auth
      headers: {
        'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET
      }
    });
    
    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    // Parse JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[bookService] Fetch error:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Make sure Cloudflare Access is configured correctly');
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
    console.log('[bookService] Calling BookFinder API:', url);
    
    const data = await simpleFetch(url);
    console.log('[bookService] BookFinder API response data:', data);
    
    if (data.error) {
      throw new Error(`BookFinder API returned error: ${data.error}`);
    }
    
    if (!data.bookLink || !data.bookLink.url) {
      throw new Error('BookFinder API returned invalid data structure: missing bookLink.url');
    }
    
    return data.bookLink.url;
  } catch (error) {
    console.error('[bookService] Error finding book URL:', error);
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
    console.log('[bookService] Calling Amazon Scraper API:', url);

    const data = await simpleFetch(url);
    console.log('[bookService] Amazon Scraper API response data:', data);

    if (data.error) {
      throw new Error(`Amazon Scraper API returned error: ${data.error}`);
    }

    return data;
  } catch (error) {
    console.error('[bookService] Error fetching book metadata:', error);
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
    console.log('[bookService] Found Amazon URL:', amazonUrl);
    
    // Step 2: Use the URL to fetch metadata
    const metadata = await fetchBookMetadata(amazonUrl);
    console.log('[bookService] Retrieved metadata:', metadata);
    
    return metadata;
  } catch (error) {
    console.error('[bookService] Error in complete book lookup workflow:', error);
    throw error;
  }
};

/**
 * Fetches thematic emojis for a book based on its description
 * @param {string} description - Book description
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @returns {Promise<string>} - Two emojis that represent the book
 */
export const fetchBookEmojis = async (description, title, author) => {
  try {
    console.log('[bookService] fetchBookEmojis called with:', { 
      title, 
      author, 
      descriptionPreview: description ? description.substring(0, 50) + '...' : 'null' 
    });
    
    if (!description || description === 'Not found') {
      console.log('[bookService] No description available for emoji generation, returning null');
      return null;
    }
    
    // Call the emoji generator worker with Cloudflare Access authentication
    console.log('[bookService] Calling emoji generator API with POST request');
    const response = await fetch(`${EMOJI_GENERATOR_API}/generate-emojis`, {
      method: 'POST',
      credentials: 'include', // Important for cookie-based auth
      headers: {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET
      },
      body: JSON.stringify({
        description,
        title,
        author
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[bookService] Error from emoji API:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('[bookService] Emoji API response:', data);
    
    if (data && data.emojis) {
      console.log('[bookService] Successfully retrieved emojis:', data.emojis);
      return data.emojis;
    } else {
      console.warn('[bookService] Emoji API returned unexpected structure:', data);
      return null;
    }
  } catch (error) {
    console.error('[bookService] Error fetching book emojis:', error);
    return null;
  }
};

/**
 * Gets random book-related emojis as a fallback
 * @returns {string} - Two random book-related emojis
 */
export const getRandomBookEmojis = () => {
  const bookEmojis = ['📚', '📖', '📘', '📕', '📙', '📗', '🧠', '✍️', '🔖', '📝', '🧐', '🤓', '👓', '🖋️'];
  const getRandomEmoji = () => bookEmojis[Math.floor(Math.random() * bookEmojis.length)];
  return `${getRandomEmoji()}${getRandomEmoji()}`;
};