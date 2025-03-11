// File: book-notes-app/src/utils/generateMarkdown.js
// Path: book-notes-app/src/utils/generateMarkdown.js
import { format as formatDate } from 'date-fns';

/**
 * Fetches thematic emojis for a book based on its description
 * @param {string} description - Book description
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @returns {Promise<string>} - Two emojis that represent the book
 */
export const fetchBookEmojis = async (description, title, author) => {
  try {
    if (!description || description === 'Not found') {
      return null;
    }
    
    // Call the emoji generator worker
    const response = await fetch('https://emoji-generator.samrhea.workers.dev/generate-emojis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        title,
        author
      }),
    });
    
    if (!response.ok) {
      console.error('Error fetching book emojis:', await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.emojis;
  } catch (error) {
    console.error('Error fetching book emojis:', error);
    return null;
  }
};

/**
 * Gets random book-related emojis as a fallback
 * @returns {string} - Two random book-related emojis
 */
const getRandomBookEmojis = () => {
  const bookEmojis = ['📚', '📖', '📘', '📕', '📙', '📗', '🧠', '✍️', '🔖', '📝', '🧐', '🤓', '👓', '🖋️'];
  const getRandomEmoji = () => bookEmojis[Math.floor(Math.random() * bookEmojis.length)];
  return `${getRandomEmoji()}${getRandomEmoji()}`;
};

/**
 * Generates markdown template for book notes with proper casing for titles and authors
 * @param {Object} bookData - Book data from form and/or metadata
 * @returns {string} - Generated markdown content
 */
export const generateMarkdown = (bookData) => {
  const { 
    title, 
    author, 
    dateStarted, 
    dateFinished, 
    placesRead, 
    format,
    // Metadata fields from Amazon
    yearPublished,
    pageLength,
    asin,
    description: apiDescription, // API-sourced description
    // New fields
    frontmatterDescription, // Form-input description for frontmatter
    whyReadIt,
    notes,
    // New emoji field
    bookEmojis
  } = bookData;
  
  // Generate slug from title and current year
  const currentYear = new Date().getFullYear();
  const titleForSlug = title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
  const slug = `/posts/${currentYear}/${titleForSlug}`;
  
  // Format dates for display
  const formattedDateFinished = formatDate(new Date(dateFinished), 'yyyy-MM-dd');
  
  // Use provided book emojis or random fallback
  const emojiPrefix = bookEmojis || getRandomBookEmojis();
  
  const markdown = `---
title: "${emojiPrefix} ${title} by ${author}"
date: "${formattedDateFinished}"
template: "post"
draft: false
slug: "${slug}"
category: "reading"
tags:
  - "reading"
  - "books"
description: "${frontmatterDescription || 'TBD'}"
---

> ## Not a Book Report
> I enjoy [reflecting](https://blog.samrhea.com/posts/2019/analyze-media-habits) on the movies, TV, books and other media that I consume. I'm notoriously sentimental. This [series](https://blog.samrhea.com/category/reading) documents the books that I read. These aren't reviews or recommendations. Just a list. For me. Mostly so that I can page through what I read, where I was, and when.

## Why did I read it?

${whyReadIt || '[To be filled]'}

## What is it?

|Category|Value|
|---|---|
|**Title**|*${title}*|
|**Author**|${author}|
|**Year Published**|${yearPublished || '[To be filled]'}|
|**Format**|${format}|
|**Pages**|${pageLength || '[To be filled]'}|${asin && asin !== 'Not found' ? `\n|**Amazon**|[Link](https://www.amazon.com/dp/${asin}/)` : ''}
|**ASIN**|${asin && asin !== 'Not found' ? asin : '[To be filled]'}|

### Publisher Summary

${apiDescription && apiDescription !== 'Not found' ? apiDescription : '[Publisher summary to be filled]'}

## How did I read it?

|Category|Value|
|---|---|
|**Date Started**|${dateStarted ? formatDate(new Date(dateStarted), 'MMMM d, yyyy') : '[To be filled]'}|
|**Date Finished**|${formatDate(new Date(dateFinished), 'MMMM d, yyyy')}|
|**Places Read**|${placesRead || '[To be filled]'}|

## Notes - No Spoilers

${notes ? notes.split('\n').map(note => `* ${note}`).join('\n') : '* [Your notes here]'}
`;

  return markdown;
};

/**
 * Generates markdown with fetched metadata and thematic emojis
 * @param {Object} formData - Form data
 * @param {Object} metadata - Fetched metadata from Amazon
 * @returns {Promise<string>} - Generated markdown content
 */
export const generateMarkdownWithMetadata = async (formData, metadata) => {
  try {
    console.log('Generating markdown with metadata:', metadata);
    
    // Extract title and author from metadata if available (with fallbacks)
    const title = (metadata.title && metadata.title !== 'Not found') 
      ? metadata.title 
      : formData.title;
      
    const author = (metadata.author && metadata.author !== 'Not found') 
      ? metadata.author 
      : formData.author;
    
    console.log('Using title from metadata:', title);
    console.log('Using author from metadata:', author);
    
    // Get book description from metadata
    const description = metadata.description !== 'Not found' ? metadata.description : null;
    
    // Fetch thematic emojis based on description
    let bookEmojis = null;
    if (description) {
      console.log('Fetching thematic emojis for book based on description');
      bookEmojis = await fetchBookEmojis(description, title, author);
      console.log('Generated book emojis:', bookEmojis);
    }
    
    // Clean metadata values
    const cleanMetadata = {
      title: title, // Explicitly use the metadata title
      author: author, // Explicitly use the metadata author
      yearPublished: metadata.yearPublished !== 'Not found' ? metadata.yearPublished : '',
      pageLength: metadata.pageLength !== 'Not found' ? metadata.pageLength : '',
      asin: metadata.asin !== 'Not found' ? metadata.asin : '',
      description: metadata.description !== 'Not found' ? metadata.description : '',
      bookEmojis: bookEmojis // Add the generated emojis
    };
    
    // Create a new object with form data and metadata
    // IMPORTANT: Override the title and author from the form with the values from metadata
    const enrichedData = {
      ...formData,
      ...cleanMetadata,
      // Ensure these override any values from formData
      title: cleanMetadata.title,
      author: cleanMetadata.author
    };
    
    // Log the final data to verify title and author are correct
    console.log('Final enriched data for markdown:', enrichedData);
    
    // Use the original function with enriched data
    return generateMarkdown(enrichedData);
  } catch (error) {
    console.error('Error generating markdown with metadata:', error);
    // Fall back to basic template if there's an error
    return generateMarkdown(formData);
  }
};