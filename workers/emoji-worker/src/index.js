// File: emoji-generator/index.js
// Simple Cloudflare Worker for generating book-themed emojis

export default {
    async fetch(request, env, ctx) {
      // Handle CORS
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
      
      // Handle API routes
      const url = new URL(request.url);
      
      if (url.pathname === "/generate-emojis") {
        try {
          // Parse input data
          let description, title, author;
          
          if (request.method === "POST") {
            const data = await request.json();
            description = data.description;
            title = data.title;
            author = data.author;
          } else {
            const params = new URLSearchParams(url.search);
            description = params.get("description");
            title = params.get("title");
            author = params.get("author");
          }
          
          if (!description) {
            return jsonResponse({ error: "Missing description" }, 400);
          }
          
          // Generate emojis using AI
          const emojis = await generateBookEmojis(env, description, title, author);
          
          return jsonResponse({ emojis });
        } catch (error) {
          return jsonResponse({ error: error.message }, 500);
        }
      }
      
      // Default response
      return jsonResponse({ 
        message: "Book Emoji Generator API",
        usage: "POST /generate-emojis with JSON body: {description, title, author}"
      });
    }
  };
  
  /**
   * Generates thematic emojis for a book based on its description
   */
  async function generateBookEmojis(env, description, title, author) {
    try {
      // Create prompt for the LLM
      const bookInfo = [
        title ? `Title: ${title}` : '',
        author ? `Author: ${author}` : '',
        `Description: ${description}`
      ].filter(Boolean).join('\n');
  
      const prompt = `
  Based on this book information, generate exactly two emojis that playfully represent the book's unique plot:
  
  ${bookInfo}
  
  Return exactly two emojis with no explanation or other text. Try to be more creative than just a rocket ship for books about space.`;
  
      // Call Llama model
      const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10
      });
  
      // Extract emojis
      const emojis = response.response.trim();
      const emojiRegex = /[\p{Emoji}]/gu;
      const matches = emojis.match(emojiRegex);
      
      if (matches && matches.length >= 2) {
        return matches.slice(0, 2).join('');
      }
      
      // Fallback emoji pairs
      const fallbackEmojis = ['📚🔍', '📖✨', '📘🧠', '📕❤️', '📙🌟', '📗🌱'];
      return fallbackEmojis[Math.floor(Math.random() * fallbackEmojis.length)];
    } catch (error) {
      console.error(`Error generating emojis: ${error}`);
      return '📚📖'; // Default fallback
    }
  }
  
  /**
   * Helper for JSON responses with CORS headers
   */
  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }