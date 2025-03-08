// book-notes-app/src/utils/dateUtils.js
import { format, parseISO } from 'date-fns';

/**
 * Formats a date string to YYYY-MM-DD format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Formats a date for display in the markdown
 * @param {Date|string} date - Date to format
 * @returns {string} Human-readable date
 */
export const formatDisplayDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting display date:', error);
    return '';
  }
};

/**
 * Returns today's date as a YYYY-MM-DD string
 * @returns {string} Today's date
 */
export const getTodayDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Extracts the year from a date
 * @param {Date|string} date - Date to extract year from
 * @returns {number} Year
 */
export const getYear = (date) => {
  if (!date) return new Date().getFullYear();
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj.getFullYear();
  } catch (error) {
    console.error('Error getting year:', error);
    return new Date().getFullYear();
  }
};