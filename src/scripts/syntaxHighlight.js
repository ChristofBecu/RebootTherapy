// Syntax highlighting using CDN version of Highlight.js
// This will be initialized after content is loaded

export function initSyntaxHighlighting() {
  // Check if highlight.js is loaded
  if (typeof hljs === 'undefined') {
    console.error('Highlight.js not loaded');
    return;
  }

  // Highlight all code blocks
  document.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSyntaxHighlighting);
} else {
  initSyntaxHighlighting();
}
