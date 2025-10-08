// Navigation menu management
import { CONFIG } from './config.js';
import { isMobileView } from './utils.js';

/**
 * Initialize navigation menu state and toggle functionality
 * @param {HTMLElement} sidebar - The sidebar navigation element
 * @param {HTMLElement} toggleButton - The menu toggle button
 */
export function initNavigation(sidebar, toggleButton) {
    // Set initial state based on viewport
    updateMenuState(sidebar, toggleButton);
    
    // Add toggle listener
    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        updateButtonIcon(sidebar, toggleButton);
    });
    
    return { sidebar, toggleButton };
}

/**
 * Update menu state based on viewport size
 */
function updateMenuState(sidebar, toggleButton) {
    if (isMobileView()) {
        sidebar.classList.add('hidden');
        toggleButton.innerHTML = CONFIG.icons.menuOpen;
    } else {
        sidebar.classList.remove('hidden');
        toggleButton.innerHTML = CONFIG.icons.menuClose;
    }
}

/**
 * Update toggle button icon based on sidebar visibility
 */
function updateButtonIcon(sidebar, toggleButton) {
    if (sidebar.classList.contains('hidden')) {
        toggleButton.innerHTML = CONFIG.icons.menuOpen;
    } else {
        toggleButton.innerHTML = CONFIG.icons.menuClose;
    }
}

/**
 * Render the post list in the navigation
 * @param {HTMLElement} navList - The UL element to render into
 * @param {Array} posts - Array of post objects (should be pre-sorted by date)
 * @param {Array} allPosts - Full post data with tags
 * @param {string} currentTag - Currently active tag filter
 * @param {Function} onPostClick - Callback when a post is clicked
 */
export function renderPostList(navList, posts, allPosts, currentTag, onPostClick) {
    navList.innerHTML = '';
    
    // Filter posts based on current tag
    const filteredPosts = posts.filter(post => {
        if (currentTag === 'all') return true;
        
        const postData = allPosts.find(p => p.name === post.name);
        return postData && postData.tags && postData.tags.includes(currentTag);
    });
    
    // Render filtered posts (maintains original sort order)
    filteredPosts.forEach(post => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.setAttribute('data-post', post.name);
        link.textContent = post.title;
        listItem.appendChild(link);
        navList.appendChild(listItem);
    });
}

/**
 * Attach event listener for post navigation (call once during initialization)
 * @param {HTMLElement} navList - The UL element to attach listener to
 * @param {Function} onPostClick - Callback when a post is clicked
 */
export function attachPostClickListener(navList, onPostClick) {
    navList.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            event.preventDefault();
            const postName = event.target.getAttribute('data-post');
            onPostClick(postName);
        }
    });
}

/**
 * Close navigation menu on mobile
 * @param {HTMLElement} sidebar - The sidebar navigation element
 * @param {HTMLElement} toggleButton - The menu toggle button
 */
export function closeMenuOnMobile(sidebar, toggleButton) {
    if (isMobileView()) {
        sidebar.classList.add('hidden');
        toggleButton.innerHTML = CONFIG.icons.menuOpen;
    }
}
