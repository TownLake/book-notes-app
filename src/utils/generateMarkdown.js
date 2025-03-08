// book-notes-app/src/utils/generateMarkdown.js
import { format as formatDate } from 'date-fns';

export const generateMarkdown = (bookData) => {
  const { 
    title, 
    author, 
    dateStarted, 
    dateFinished, 
    placesRead, 
    format 
  } = bookData;
  
  // Generate slug from title and current year
  const currentYear = new Date().getFullYear();
  const slug = `/posts/${currentYear}/${title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')}`;
  
  // Format dates for display
  const formattedDateFinished = formatDate(new Date(dateFinished), 'yyyy-MM-dd');
  
  // Create emoji prefix (random book-related emoji combination)
  const bookEmojis = ['📚', '📖', '📘', '📕', '📙', '📗', '🧠', '✍️', '🔖', '📝', '🧐', '🤓', '👓', '🖋️'];
  const getRandomEmoji = () => bookEmojis[Math.floor(Math.random() * bookEmojis.length)];
  const emojiPrefix = `${getRandomEmoji()}${getRandomEmoji()}`;
  
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
description: "Fun to finally finish it."
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
|**Year Published**|[To be filled]|
|**Format**|${format}|
|**Pages**|[To be filled]|
|**ASIN**|[To be filled]|

### Publisher Summary
[Publisher summary to be filled]

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