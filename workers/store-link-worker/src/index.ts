// workers/store-link-worker/src/index.ts
// deployed to https://book-finder.samrhea.workers.dev

import { Agent, AgentNamespace } from 'agents-sdk';
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  BookFinderAgent: AgentNamespace;
  BROWSER: Fetcher;
}

interface BookSearchState {
  recentSearches?: {
    query: string;
    bookUrl: string;
    storeType: string;
    timestamp: string;
  }[];
  errors?: {
    timestamp: string;
    query: string;
    error: string;
  }[];
}

interface BookLink {
  url: string;
  title: string;
  storeType: string;
}

export class BookFinder extends Agent<Env, BookSearchState> {
  async fetch(request: Request): Promise<Response> {
    try {
      // Handle CORS preflight requests
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "https://try-agents.book-notes-app.pages.dev",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400"
          }
        });
      }
      
      const url = new URL(request.url);
      
      // Handle root path with a simple form
      if (url.pathname === "/" || url.pathname === "") {
        return new Response(
          `
          <html>
            <head>
              <title>Book Finder</title>
              <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                h1 { color: #f38020; }
                form { margin: 20px 0; }
                input, button, select { padding: 8px; margin: 5px 0; }
                input[type="text"] { width: 100%; }
                button { background: #f38020; color: white; border: none; cursor: pointer; }
              </style>
            </head>
            <body>
              <h1>Book Finder</h1>
              <p>Enter a book title to find its online store link:</p>
              <form action="/search" method="get">
                <input type="text" name="query" placeholder="e.g., The Hitchhiker's Guide to the Galaxy Douglas Adams" required>
                <select name="store">
                  <option value="amazon">Amazon</option>
                  <option value="barnesnoble">Barnes & Noble</option>
                  <option value="any">Any Retailer</option>
                </select>
                <button type="submit">Find Book</button>
              </form>
            </body>
          </html>
          `,
          {
            headers: {
              "Content-Type": "text/html",
              "Access-Control-Allow-Origin": "https://try-agents.book-notes-app.pages.dev",
              "Access-Control-Allow-Credentials": "true"
            },
          }
        );
      }
      
      // Handle search requests
      if (url.pathname === "/search") {
        const query = url.searchParams.get("query");
        const store = url.searchParams.get("store") || "amazon";
        
        if (!query) {
          return new Response(JSON.stringify({ error: "Query parameter is required" }), {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "https://try-agents.book-notes-app.pages.dev",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
              "Access-Control-Allow-Credentials": "true"
            },
          });
        }

        try {
          const bookLink = await this.findBookWithGoogleSearch(query, store);
          
          // Save to state (safely initialize if needed)
          const currentState = this.state || {};
          const recentSearches = currentState.recentSearches || [];
          
          this.setState({
            ...currentState,
            recentSearches: [
              {
                query,
                bookUrl: bookLink.url,
                storeType: bookLink.storeType,
                timestamp: new Date().toISOString()
              },
              ...recentSearches.slice(0, 9)  // Keep last 10 searches
            ]
          });
          
          return Response.json({ 
            query,
            bookLink
          }, {
            headers: {
              "Access-Control-Allow-Origin": "https://try-agents.book-notes-app.pages.dev",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
              "Access-Control-Allow-Credentials": "true"
            }
          });
        } catch (error) {
          // Log the error
          this.logError(query, error instanceof Error ? error.message : String(error));
          
          return Response.json(
            { 
              error: "Failed to find the book", 
              message: error instanceof Error ? error.message : String(error) 
            }, 
            { 
              status: 500,
              headers: {
                "Access-Control-Allow-Origin": "https://try-agents.book-notes-app.pages.dev",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
                "Access-Control-Allow-Credentials": "true"
              }
            }
          );
        }
      }

      // Handle other requests with a 404
      return new Response("Not found", { 
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "https://try-agents.book-notes-app.pages.dev",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    } catch (error) {
      console.error(`Error in fetch: ${error instanceof Error ? error.stack : String(error)}`);
      return Response.json({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : String(error) 
      }, { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://try-agents.book-notes-app.pages.dev",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    }
  }

  private async findBookWithGoogleSearch(query: string, storePreference: string = "amazon"): Promise<BookLink> {
    console.log(`Searching for book: ${query} on ${storePreference}`);
    
    // Create a search-friendly query with store preference
    let searchQuery = encodeURIComponent(`${query} book`);
    
    if (storePreference === "amazon") {
      searchQuery = encodeURIComponent(`${query} book amazon`);
    } else if (storePreference === "barnesnoble") {
      searchQuery = encodeURIComponent(`${query} book barnes noble`);
    }
    
    const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
    
    try {
      // Launch a browser instance
      const browser = await puppeteer.launch(this.env.BROWSER);
      
      try {
        const page = await browser.newPage();
        
        // Set a user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
        
        // Navigate to Google search
        console.log(`Navigating to: ${googleSearchUrl}`);
        await page.goto(googleSearchUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        
        // Wait for a short time for the page to fully render
        await page.waitForTimeout(3000);
        
        // Wait for search results to load
        await page.waitForSelector('#search', { timeout: 15000 }).catch(() => null);
        
        // Extract book links
        const bookLinks = await page.evaluate((storeType) => {
          const links: Array<{url: string, title: string, storeType: string}> = [];
          const resultElements = document.querySelectorAll('#search a');
          
          for (const element of resultElements) {
            const href = element.getAttribute('href');
            if (!href || !href.startsWith('http')) continue;
            
            const title = element.textContent || '';
            let foundStoreType = 'unknown';
            
            // Determine store type from URL
            if (href.includes('amazon.com')) {
              foundStoreType = 'amazon';
            } else if (href.includes('barnesandnoble.com')) {
              foundStoreType = 'barnesnoble';
            } else if (href.includes('books.google.com')) {
              foundStoreType = 'google';
            } else if (href.includes('goodreads.com')) {
              foundStoreType = 'goodreads';
            } else if (href.includes('bookshop.org')) {
              foundStoreType = 'bookshop';
            } else {
              // Skip links that aren't from book stores
              continue;
            }
            
            // Skip ads and other non-relevant links
            if (href.includes('/aclk?') || href.includes('/url?')) continue;
            
            links.push({
              url: href,
              title: title,
              storeType: foundStoreType
            });
          }
          
          return links;
        }, storePreference);
        
        console.log(`Found ${bookLinks.length} potential book links`);
        
        if (bookLinks.length === 0) {
          throw new Error("No book links found in search results");
        }
        
        // Filter by store preference if specified
        let filteredLinks = bookLinks;
        if (storePreference !== "any") {
          filteredLinks = bookLinks.filter(link => link.storeType === storePreference);
          
          // If no matches for preferred store, use any available book link
          if (filteredLinks.length === 0) {
            filteredLinks = bookLinks;
          }
        }
        
        // Return the first matching link
        const bestMatch = filteredLinks[0];
        console.log(`Selected book link: ${bestMatch.url} (${bestMatch.storeType})`);
        
        return bestMatch;
      } finally {
        // Make sure browser is closed even if an error occurs
        await browser.close();
      }
    } catch (error) {
      console.error(`Error searching for book: ${error instanceof Error ? error.stack : String(error)}`);
      throw new Error(`Failed to search for book: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private logError(query: string, errorMessage: string): void {
    // Initialize state safely
    const currentState = this.state || {};
    const errors = currentState.errors || [];
    
    // Add the new error to the state
    this.setState({
      ...currentState,
      errors: [
        {
          timestamp: new Date().toISOString(),
          query,
          error: errorMessage
        },
        ...errors.slice(0, 19)  // Keep last 20 errors
      ]
    });
    
    // Log the error to the console as well
    console.error(`Book search error - Query: "${query}", Error: ${errorMessage}`);
  }
}

// Export default with direct fetch to the agent
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Handle CORS preflight requests at the global level
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "https://try-agents.book-notes-app.pages.dev",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400"
          }
        });
      }
      
      // Create a simple ID
      const id = env.BookFinderAgent.idFromName("default");
      
      // Get the agent instance
      const agent = env.BookFinderAgent.get(id);
      
      // Pass the request directly to the agent's fetch method
      return await agent.fetch(request);
    } catch (error) {
      console.error(`Global error: ${error instanceof Error ? error.stack : String(error)}`);
      return Response.json({
        error: "An unexpected error occurred",
        message: error instanceof Error ? error.message : String(error)
      }, { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://try-agents.book-notes-app.pages.dev",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    }
  }
};