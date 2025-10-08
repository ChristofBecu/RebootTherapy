// Post rendering with markdown parsing and image handling
import { CONFIG } from './config.js';
import { scrollToTop, parseFrontmatter } from './utils.js';
import { initReactions } from './reactions.js';

/**
 * Render a post's markdown content into the container
 * @param {string} postName - Name of the post to render
 * @param {string} markdown - Raw markdown content
 * @param {HTMLElement} container - Container element to render into
 */
export async function renderPost(postName, markdown, container) {
    // Parse and strip frontmatter
    const parsed = parseFrontmatter(markdown);
    const contentWithoutFrontmatter = parsed.content || markdown;
    
    // Configure marked renderer for custom image handling
    const renderer = createImageRenderer(postName);
    
    // Parse markdown to HTML
    const html = marked.parse(contentWithoutFrontmatter, { renderer });
    container.innerHTML = html;
    
    // Initialize commit history viewer if present
    initCommitHistoryViewer(container);
    
    // Add reactions widget at the end of the post
    addReactionsWidget(postName, container);
    
    // Scroll to top
    scrollToTop(document.querySelector('main'));
}

/**
 * Create a custom marked renderer for handling relative image paths
 * @param {string} postName - Name of the post for image URL construction
 * @returns {marked.Renderer} Configured marked renderer
 */
function createImageRenderer(postName) {
    const renderer = new marked.Renderer();
    const originalImage = renderer.image.bind(renderer);
    
    renderer.image = function(token) {
        // Handle both token object (newer marked.js) and parameters (older versions)
        const href = typeof token === 'string' ? token : token.href;
        const title = typeof token === 'object' ? token.title : arguments[1];
        const text = typeof token === 'object' ? token.text : arguments[2];
        
        // Transform relative paths to use the Netlify image function
        let newHref = href;
        if (href && href.startsWith('./')) {
            const imageName = href.substring(2); // Remove './'
            newHref = CONFIG.api.image(postName, imageName);
        }
        
        // Update token or pass parameters based on format
        if (typeof token === 'object') {
            token.href = newHref;
            return originalImage(token);
        } else {
            return originalImage(newHref, title, text);
        }
    };
    
    return renderer;
}

/**
 * Initialize commit history viewer if placeholder element exists
 * @param {HTMLElement} container - Container to search for commit history placeholder
 */
function initCommitHistoryViewer(container) {
    const commitPlaceholder = container.querySelector('[data-commit-history]');
    if (!commitPlaceholder) return;
    
    const owner = commitPlaceholder.dataset.owner || CONFIG.commitHistory.defaultOwner;
    const repo = commitPlaceholder.dataset.repo || CONFIG.commitHistory.defaultRepo;
    const path = commitPlaceholder.dataset.path || '';
    
    // Create unique ID if not present
    if (!commitPlaceholder.id) {
        commitPlaceholder.id = `commit-viewer-${Date.now()}`;
    }
    
    // Initialize commit viewer (assumes CommitHistoryViewer is globally available)
    if (typeof CommitHistoryViewer !== 'undefined') {
        const viewer = new CommitHistoryViewer(commitPlaceholder.id);
        viewer.initExternal(owner, repo, path);
    }
}

/**
 * Add reactions widget to the post
 * @param {string} postName - Name of the post
 * @param {HTMLElement} container - Container element
 */
function addReactionsWidget(postName, container) {
    // Create reactions container
    const reactionsContainer = document.createElement('div');
    reactionsContainer.className = 'reactions-container';
    reactionsContainer.id = `reactions-${postName}`;
    
    // Append to the end of the post content
    container.appendChild(reactionsContainer);
    
    // Initialize reactions widget
    initReactions(postName, reactionsContainer);
}
