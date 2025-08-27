import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Used for user-generated content like stance rationales
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Strips all HTML tags from content
 * Used for plain text display
 */
export const stripHtml = (content: string): string => {
  return DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });
};