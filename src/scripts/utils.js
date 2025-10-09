// Utility functions used across the application

/**
 * Check if current viewport is mobile size
 */
export function isMobileView() {
    return window.matchMedia('(max-width: 768px)').matches;
}

/**
 * Scroll an element to the top
 */
export function scrollToTop(element) {
    if (element) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            element.scrollTo({
                top: 0,
                behavior: 'instant'
            });
        });
    }
}

/**
 * Parse YAML frontmatter from markdown content
 * @param {string} markdown - The markdown content with optional frontmatter
 * @returns {Object} Object containing tags array and content without frontmatter
 */
export function parseFrontmatter(markdown) {
    const frontmatterRegex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/;
    const match = markdown.match(frontmatterRegex);
    
    if (!match) {
        return { tags: [], content: markdown };
    }
    
    const frontmatter = {};
    const lines = match[1].split(/[\r\n]+/);
    
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            frontmatter[key] = value;
        }
    });
    
    // Parse tags (comma-separated)
    if (frontmatter.tags) {
        frontmatter.tags = frontmatter.tags.split(',').map(t => t.trim());
    } else {
        frontmatter.tags = [];
    }
    
    // Strip frontmatter from content
    const content = markdown.replace(frontmatterRegex, '').trim();
    frontmatter.content = content;
    
    return frontmatter;
}
