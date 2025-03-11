// book-notes-app/src/utils/generateMarkdown.js
import { format as formatDate } from 'date-fns';

/**
 * Generates markdown template for book notes
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
    description
  } = bookData;
  
  // Generate slug from title and current year
  const currentYear = new Date().getFullYear();
  const titleForSlug = title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
  const slug = `/posts/${currentYear}/${titleForSlug}`;
  
  // Format dates for display
  const formattedDateFinished = formatDate(new Date(dateFinished), 'yyyy-MM-dd');
  
  // Create emoji prefix (random book-related emoji combination)
  const bookEmojis = ['📚', '📖', '📘', '📕', '📙', '📗', '🧠', '✍️', '🔖', '📝', '🧐', '🤓', '👓', '🖋️'];
  const getRandomEmoji = () => bookEmojis[Math.floor(Math.random() * bookEmojis.length)];
  const emojiPrefix = `${getRandomEmoji()}${getRandomEmoji()}`;
  
  // Create description from book metadata or use default
  const metaDescription = description 
    ? `Notes on "${title}" by ${author}.` 
    : "Fun to finally finish it.";
  
  // Truncate the description if too long
  const truncatedDescription = metaDescription.length > 150 
    ? metaDescription.substring(0, 147) + '...' 
    : metaDescription;
  
  // Create a clean Amazon link for the book if we have an ASIN
  const amazonLink = asin 
    ? `https://www.amazon.com/dp/${asin}/` 
    : null;
  
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
description: "${truncatedDescription}"
---

> ## Not a Book Report
> I enjoy [reflecting](https://blog.samrhea.com/posts/2019/analyze-media-habits) on the movies, TV, books and other media that I consume. I'm notoriously sentimental. This [series](https://blog.samrhea.com/category/reading) documents the books that I read. These aren't reviews or recommendations. Just a list. For me. Mostly so that I can page through what I read, where I was, and when.

## Why did I read it?
[Your reasons for reading this book]

## What is it?
|Category|Value|
|---|---|
|**Title**|*${title}*|
|**Author**|${author}|
|**Year Published**|${yearPublished || '[To be filled]'}|
|**Format**|${format}|
|**Pages**|${pageLength || '[To be filled]'}|${amazonLink ? `\n|**Amazon**|[Link](${amazonLink})` : ''}
|**ASIN**|${asin || '[To be filled]'}|

### Publisher Summary
${description || '[Publisher summary to be filled]'}

## How did I read it?
|Category|Value|
|---|---|
|**Date Started**|${dateStarted ? formatDate(new Date(dateStarted), 'MMMM d, yyyy') : '[To be filled]'}|
|**Date Finished**|${formatDate(new Date(dateFinished), 'MMMM d, yyyy')}|
|**Places Read**|${placesRead || '[To be filled]'}|

## Notes - No Spoilers
* [Your notes here]
`;

  return markdown;
};

/**
 * Generates markdown with fetched metadata
 * @param {Object} bookData - Form data
 * @param {Object} metadata - Fetched metadata from Amazon
 * @returns {string} - Generated markdown content
 */
export const generateMarkdownWithMetadata = async (bookData, metadata) => {
  try {
    console.log('Generating markdown with metadata:', metadata);
    
    // Clean metadata values
    const cleanMetadata = {
      yearPublished: metadata.yearPublished !== 'Not found' ? metadata.yearPublished : '',
      pageLength: metadata.pageLength !== 'Not found' ? metadata.pageLength : '',
      asin: metadata.asin !== 'Not found' ? metadata.asin : '',
      description: metadata.description !== 'Not found' ? metadata.description : ''
    };
    
    // Merge the book data with cleaned metadata
    const enrichedData = {
      ...bookData,
      ...cleanMetadata,
      // Use form author if available, otherwise use metadata author
      author: bookData.author || (metadata.author !== 'Not found' ? metadata.author : ''),
      // Use form title if available, otherwise use metadata title
      title: bookData.title || (metadata.title !== 'Not found' ? metadata.title : '')
    };
    
    // Use the original function with enriched data
    return generateMarkdown(enrichedData);
  } catch (error) {
    console.error('Error generating markdown with metadata:', error);
    // Fall back to basic template if there's an error
    return generateMarkdown(bookData);
  }
};