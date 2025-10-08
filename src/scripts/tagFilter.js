// Tag filtering functionality

/**
 * Render tag filter buttons
 * @param {Set} allTags - Set of all available tags
 * @param {Function} onTagClick - Callback when a tag is clicked
 */
export function renderTagFilter(allTags, onTagClick) {
    const tagList = document.getElementById('tag-list');
    tagList.innerHTML = '';
    
    // Add "All Posts" button
    const allBtn = document.createElement('button');
    allBtn.className = 'tag-filter-btn active';
    allBtn.textContent = 'All Posts';
    allBtn.onclick = () => onTagClick('all');
    tagList.appendChild(allBtn);
    
    // Add individual tag buttons
    Array.from(allTags).sort().forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'tag-filter-btn';
        btn.textContent = tag;
        btn.dataset.tag = tag;
        btn.onclick = () => onTagClick(tag);
        tagList.appendChild(btn);
    });
    
    // Make tag section collapsible
    initCollapsibleTagSection();
}

/**
 * Initialize collapsible functionality for tag section
 */
function initCollapsibleTagSection() {
    const tagSection = document.querySelector('.tag-filter-section');
    const heading = tagSection.querySelector('h3');
    
    // Start collapsed to save space
    tagSection.classList.add('collapsed');
    
    heading.onclick = (e) => {
        e.stopPropagation();
        tagSection.classList.toggle('collapsed');
    };
}

/**
 * Update active state of tag buttons
 * @param {string} activeTag - The currently active tag ('all' or tag name)
 */
export function updateTagButtonStates(activeTag) {
    document.querySelectorAll('.tag-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((activeTag === 'all' && btn.textContent === 'All Posts') || 
            (btn.dataset.tag === activeTag)) {
            btn.classList.add('active');
        }
    });
}

/**
 * Collect all unique tags from posts
 * @param {Array} posts - Array of post objects with tags
 * @returns {Set} Set of all unique tags
 */
export function collectTags(posts) {
    const tags = new Set();
    posts.forEach(post => {
        if (post.tags && post.tags.length > 0) {
            post.tags.forEach(tag => tags.add(tag));
        }
    });
    return tags;
}
