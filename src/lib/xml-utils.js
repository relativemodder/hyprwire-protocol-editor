/**
 * XML utility functions for protocol parsing and serialization
 */

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Unescape XML entities
 * @param {string} str - String to unescape
 * @returns {string} Unescaped string
 */
export function unescapeXml(str) {
  return str
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

/**
 * Get direct text content from an element, cleaning up whitespace
 * @param {Element} parent - Parent element
 * @param {string} tagName - Tag name to find
 * @returns {string|undefined} Cleaned text content
 */
export function getDirectTextContent(parent, tagName) {
  const el = parent.querySelector(`:scope > ${tagName}`);
  if (!el) return undefined;
  
  let text = el.textContent;
  text = text.replace(/^\n/, '').replace(/\n$/, '');
  
  if (!text.trim()) return undefined;
  
  const lines = text.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  if (nonEmptyLines.length === 0) return undefined;
  
  const minIndent = Math.min(
    ...nonEmptyLines.map(line => {
      const match = line.match(/^(\s*)/);
      return match ? match[1].length : 0;
    })
  );
  
  const cleanedLines = lines.map(line => {
    if (line.trim().length === 0) return '';
    return line.slice(minIndent);
  });
  
  return cleanedLines.join('\n').trim();
}

/**
 * Serialize multiline element (copyright, description)
 * @param {string} tagName - XML tag name
 * @param {string} content - Content to serialize
 * @param {number} indent - Indentation level
 * @returns {string} Serialized XML
 */
export function serializeMultilineElement(tagName, content, indent) {
  const spaces = ' '.repeat(indent);
  
  if (!content || !content.trim()) {
    return `${spaces}<${tagName}>\n${spaces}</${tagName}>\n`;
  }
  
  const lines = content.split('\n');
  const formattedText = lines
    .map(line => line.trim() ? spaces + '  ' + line.trim() : '')
    .join('\n')
    .trim();
  
  return `${spaces}<${tagName}>\n${spaces}  ${formattedText}\n${spaces}</${tagName}>\n`;
}
