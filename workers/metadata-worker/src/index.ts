// workers/metadata-worker/src/index.ts
// deployed to https://amazon-product-scraper.samrhea.workers.dev

import { Agent, AgentNamespace, routeAgentRequest } from 'agents-sdk';
import puppeteer from '@cloudflare/puppeteer';

interface Env {
  AmazonScraper: AgentNamespace<Agent>;
  BROWSER: Fetcher;
}

interface AmazonProductData {
  asin: string;
  title: string;
  author: string;
  yearPublished: string;
  pageLength: string;
  description: string;
  url: string;
}

// Export the Durable Object class with the expected name
export class AmazonScraperAgent extends Agent<Env, {}> {
  // The Agent superclass will handle state management when invoked properly
  // by the Cloudflare Durable Objects system

  // This method is called when requests come to this agent's endpoints
  async run(request: Request): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "https://read.samrhea.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    
    // This is the method needed for the Agent class to work correctly
    // but doesn't get called directly in our custom route handler
    return new Response('Agent running', { 
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://read.samrhea.com",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
        "Access-Control-Allow-Credentials": "true"
      }
    });
  }
}

// Separate scraper class for the actual functionality
class AmazonScraper {
  env: Env;
  
  constructor(env: Env) {
    this.env = env;
  }

  async onRequest(request: Request): Promise<Response> {
    try {
      // Handle CORS preflight requests
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "https://read.samrhea.com",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400"
          }
        });
      }
      
      const url = new URL(request.url);
      
      // Check if this is an API request to scrape an Amazon product
      if (url.pathname === "/scrape") {
        const params = new URLSearchParams(url.search);
        const amazonUrl = params.get("url");
        
        if (!amazonUrl) {
          return new Response(JSON.stringify({
            error: "Missing 'url' parameter. Please provide an Amazon product URL."
          }), {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "https://read.samrhea.com",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
              "Access-Control-Allow-Credentials": "true"
            }
          });
        }

        // Validate that it's an Amazon URL
        if (!amazonUrl.includes("amazon.com")) {
          return new Response(JSON.stringify({
            error: "URL must be from amazon.com domain"
          }), {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "https://read.samrhea.com",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
              "Access-Control-Allow-Credentials": "true"
            }
          });
        }

        // Check if the BROWSER binding exists
        if (!this.env.BROWSER) {
          return new Response(JSON.stringify({
            error: "Configuration error",
            message: "The BROWSER binding is not configured correctly"
          }), {
            status: 500,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "https://read.samrhea.com",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
              "Access-Control-Allow-Credentials": "true"
            }
          });
        }

        // Scrape the product data
        try {
          const productData = await this.scrapeAmazonProduct(amazonUrl);
          
          return new Response(JSON.stringify(productData), {
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "https://read.samrhea.com",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
              "Access-Control-Allow-Credentials": "true"
            }
          });
        } catch (error) {
          console.error(`Error scraping Amazon product: ${error}`);
          return new Response(JSON.stringify({
            error: "Failed to scrape Amazon product data",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : "No stack trace available"
          }), {
            status: 500,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "https://read.samrhea.com",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
              "Access-Control-Allow-Credentials": "true"
            }
          });
        }
      }
      
      // Default response for root path
      return new Response(JSON.stringify({
        message: "Amazon Product Scraper API",
        usage: "GET /scrape?url=https://www.amazon.com/your-product-url"
      }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://read.samrhea.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    } catch (error) {
      console.error(`Unexpected error in onRequest: ${error}`);
      return new Response(JSON.stringify({
        error: "An unexpected error occurred",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace available"
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://read.samrhea.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    }
  }

  async scrapeAmazonProduct(amazonUrl: string): Promise<AmazonProductData> {
    console.log(`Starting to scrape Amazon product: ${amazonUrl}`);
    
    let browser;
    try {
      // Launch browser with error handling
      browser = await puppeteer.launch(this.env.BROWSER);
      console.log("Browser launched successfully");
      
      const page = await browser.newPage();
      console.log("New page created");
      
      // Set user agent to avoid being blocked by Amazon
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      console.log("User agent set");
      
      // Navigate to Amazon product page with a timeout
      await page.goto(amazonUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 // 30 second timeout
      });
      console.log("Page navigation completed");
      
      // Wait for content to load
      await page.waitForSelector('body', { timeout: 10000 });
      console.log('Page loaded successfully, extracting data...');
      
      // Extract ASIN from URL or page
      let asin = '';
      if (amazonUrl.includes('/dp/')) {
        asin = amazonUrl.split('/dp/')[1].split('/')[0];
      } else if (amazonUrl.includes('/gp/product/')) {
        asin = amazonUrl.split('/gp/product/')[1].split('/')[0];
      } else {
        // Try to find ASIN in the page content
        asin = await page.evaluate(() => {
          const asinElement = document.querySelector('#ASIN');
          if (asinElement && asinElement instanceof HTMLInputElement) {
            return asinElement.value;
          }
          return '';
        });
      }
      console.log(`ASIN extracted: ${asin || 'Not found'}`);
      
      // Extract title
      const title = await page.evaluate(() => {
        const titleElement = document.querySelector('#productTitle');
        return titleElement ? titleElement.textContent?.trim() : '';
      });
      console.log(`Title extracted: ${title ? 'Success' : 'Not found'}`);
      
      // Extract author
      const author = await page.evaluate(() => {
        // Try different selectors for author
        const authorElement = document.querySelector('.contributorNameID, .author a, #bylineInfo .a-link-normal');
        return authorElement ? authorElement.textContent?.trim() : '';
      });
      console.log(`Author extracted: ${author || 'Not found'}`);
      
      // Extract product details for year published and page length
      const productDetails = await page.evaluate(() => {
        const details: Record<string, string> = {};
        
        // Get all list items in the product details section
        const detailElements = document.querySelectorAll('#detailBullets_feature_div li, #productDetailsTable .content li, #detailBulletsWrapper_feature_div li, #bookDetails_feature_div .a-list-item');
        
        detailElements.forEach(element => {
          const text = element.textContent?.trim() || '';
          
          // Check for publication date
          if (text.includes('Publication date') || text.includes('Publisher')) {
            const match = text.match(/\d{4}/);
            if (match) {
              details.yearPublished = match[0];
            }
          }
          
          // Check for page length
          if (text.includes('Print length') || text.includes('pages') || text.includes('Page length')) {
            const match = text.match(/\d+\s*pages/);
            if (match) {
              details.pageLength = match[0];
            }
          }
        });
        
        return details;
      });
      console.log(`Product details extracted: ${JSON.stringify(productDetails)}`);
      
      // Extract product description
      const description = await page.evaluate(() => {
        // Try different selectors for product description
        // First check for the bookDescription expander content which contains the full description
        const bookDescExpander = document.querySelector('#bookDescription_feature_div .a-expander-content');
        if (bookDescExpander) {
          return bookDescExpander.textContent?.trim() || '';
        }
        
        // Fallback to other common selectors
        const descElement = document.querySelector(
          '#productDescription p, ' + 
          '#bookDescription_feature_div p, ' +
          '[data-feature-name="bookDescription"] .a-expander-content'
        );
        return descElement ? descElement.textContent?.trim() : '';
      });
      console.log(`Description extracted: ${description ? 'Success' : 'Not found'}`);
      
      console.log('Data extraction completed');
      
      return {
        asin: asin || 'Not found',
        title: title || 'Not found',
        author: author || 'Not found',
        yearPublished: productDetails.yearPublished || 'Not found',
        pageLength: productDetails.pageLength || 'Not found',
        description: description || 'Not found',
        url: amazonUrl
      };
    } catch (error) {
      console.error(`Error during page scraping: ${error}`);
      if (error instanceof Error) {
        console.error(`Stack trace: ${error.stack}`);
      }
      throw error;
    } finally {
      // Always close the browser if it was initialized
      if (browser) {
        try {
          await browser.close();
          console.log('Browser closed successfully');
        } catch (closeError) {
          console.error(`Error closing browser: ${closeError}`);
        }
      }
    }
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Handle CORS preflight requests at the global level
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "https://read.samrhea.com",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400"
          }
        });
      }
      
      const url = new URL(request.url);
      
      // First check if it's a scrape request
      if (url.pathname === "/scrape") {
        // Check if required bindings exist
        if (!env.BROWSER) {
          return new Response(JSON.stringify({
            error: "Configuration error",
            message: "The BROWSER binding is not configured correctly in the Cloudflare worker"
          }), {
            status: 500,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "https://read.samrhea.com",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
              "Access-Control-Allow-Credentials": "true"
            }
          });
        }
        
        // Create a normal scraper instance
        const scraper = new AmazonScraper(env);
        return scraper.onRequest(request);
      }
      
      // Try routing to agent if it's not a scrape request
      try {
        const agentResponse = await routeAgentRequest(request, env);
        if (agentResponse) {
          // Make sure the agent response has CORS headers
          const originalHeaders = agentResponse.headers;
          const newHeaders = new Headers(originalHeaders);
          newHeaders.set("Access-Control-Allow-Origin", "https://read.samrhea.com");
          newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret");
          newHeaders.set("Access-Control-Allow-Credentials", "true");
          
          return new Response(agentResponse.body, {
            status: agentResponse.status,
            statusText: agentResponse.statusText,
            headers: newHeaders
          });
        }
      } catch (agentError) {
        console.error(`Error in agent routing: ${agentError}`);
        // Continue to default response if agent routing fails
      }
      
      // Default 404 response
      return new Response(JSON.stringify({
        error: "Not found",
        message: "Try using /scrape?url=https://www.amazon.com/your-product-url"
      }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://read.samrhea.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    } catch (error) {
      console.error(`Critical error in fetch handler: ${error}`);
      return new Response(JSON.stringify({
        error: "Worker error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace available"
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://read.samrhea.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cache-Control, Pragma, Expires, Accept, Authorization, X-Requested-With, CF-Access-Client-Id, CF-Access-Client-Secret",
          "Access-Control-Allow-Credentials": "true"
        }
      });
    }
  }
} satisfies ExportedHandler<Env>;