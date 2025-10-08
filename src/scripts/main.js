// Main application entry point
import { initDarkMode } from './darkMode.js';
import { CONFIG } from './config.js';
import { isMobileView, scrollToTop, parseFrontmatter } from './utils.js';

// Global variables for tag management
let allPosts = [];
let allTags = new Set();
let currentTag = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize dark mode
    initDarkMode();

    const postContainer = document.getElementById('blog-content');
    const navList = document.querySelector('nav ul');
    const sidebar = document.querySelector('.nav-container');
    const toggleNavButton = document.getElementById('toggle-nav');
    
    // Initialize menu state based on device
    function initializeMenuState() {
        if (isMobileView()) {
            sidebar.classList.add('hidden');
            toggleNavButton.innerHTML = CONFIG.icons.menuOpen;
        } else {
            sidebar.classList.remove('hidden');
            toggleNavButton.innerHTML = CONFIG.icons.menuClose;
        }
    }
    
    initializeMenuState();

    // Add event listener to toggle the navigation menu
    toggleNavButton.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');

        // Update button icon based on sidebar visibility
        if (sidebar.classList.contains('hidden')) {
            toggleNavButton.innerHTML = CONFIG.icons.menuOpen;
        } else {
            toggleNavButton.innerHTML = CONFIG.icons.menuClose;
        }
    });

    // Fetch post names from the server
    async function fetchPostNames() {
        try {
            const response = await fetch(CONFIG.api.posts);
            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
            }
            const postNames = await response.json();
            return postNames;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    // Dynamically build the navigation menu
    async function buildNavigation() {
        const posts = await fetchPostNames();
        
        // Load all posts and collect tags
        for (const post of posts) {
            const markdown = await loadMarkdown(post.name);
            const metadata = parseFrontmatter(markdown);
            allPosts.push({
                name: post.name,
                title: post.title,
                tags: metadata.tags || []
            });
            // Add tags to global set
            if (metadata.tags && metadata.tags.length > 0) {
                metadata.tags.forEach(tag => allTags.add(tag));
            }
        }
        
        // Render tag filter
        renderTagFilter();
        
        // Render post list
        renderPostList(posts);

        // Attach event listeners to dynamically created links
        navList.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                const post = event.target.getAttribute('data-post');
                renderPost(post);
                
                // Close the menu on mobile after selecting a post
                if (isMobileView()) {
                    sidebar.classList.add('hidden');
                    toggleNavButton.innerHTML = CONFIG.icons.menuOpen;
                }
            }
        });

        // Optionally, load the first post by default
        if (posts.length > 0) {
            renderPost(posts[0].name);
        }
    }
    
    // Render tag filter buttons
    function renderTagFilter() {
        const tagList = document.getElementById('tag-list');
        tagList.innerHTML = '';
        
        // Add "All" button with post count
        const allBtn = document.createElement('button');
        allBtn.className = 'tag-filter-btn active';
        allBtn.textContent = 'All Posts';
        allBtn.onclick = () => filterByTag('all');
        tagList.appendChild(allBtn);
        
        // Add tag buttons
        Array.from(allTags).sort().forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'tag-filter-btn';
            btn.textContent = tag;
            btn.dataset.tag = tag;
            btn.onclick = () => filterByTag(tag);
            tagList.appendChild(btn);
        });
        
        // Make tag section collapsible
        const tagSection = document.querySelector('.tag-filter-section');
        const heading = tagSection.querySelector('h3');
        
        // Start collapsed to save space
        tagSection.classList.add('collapsed');
        
        heading.onclick = (e) => {
            e.stopPropagation();
            tagSection.classList.toggle('collapsed');
        };
    }
    
    // Render post list (filtered or all)
    function renderPostList(posts) {
        navList.innerHTML = '';
        posts.forEach(post => {
            const postData = allPosts.find(p => p.name === post.name);
            
            // Filter by current tag
            if (currentTag !== 'all' && (!postData || !postData.tags.includes(currentTag))) {
                return;
            }
            
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.setAttribute('data-post', post.name);
            link.textContent = post.title;
            listItem.appendChild(link);
            navList.appendChild(listItem);
        });
    }
    
    // Filter posts by tag
    function filterByTag(tag) {
        currentTag = tag;
        
        // Update button states
        document.querySelectorAll('.tag-filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if ((tag === 'all' && btn.textContent === 'All Posts') || 
                (btn.dataset.tag === tag)) {
                btn.classList.add('active');
            }
        });
        
        // Re-render post list with filter
        fetchPostNames().then(posts => renderPostList(posts));
    }

    async function loadMarkdown(post) {
        try {
            const response = await fetch(CONFIG.api.post(post));
            if (!response.ok) {
                throw new Error(`Failed to load ${post}: ${response.status} ${response.statusText}`);
            }
            const text = await response.text();
            return text;
        } catch (error) {
            console.error(error);
            return `# Error\nCould not load the post: ${post}`;
        }
    }

    async function renderPost(post) {
        const markdown = await loadMarkdown(post);
        
        // Parse and strip frontmatter
        const parsed = parseFrontmatter(markdown);
        const contentWithoutFrontmatter = parsed.content || markdown;
        
        // Configure marked renderer to handle relative image paths
        const renderer = new marked.Renderer();
        const originalImage = renderer.image.bind(renderer);
        
        renderer.image = function(token) {
            // In newer marked.js, image receives a token object
            const href = typeof token === 'string' ? token : token.href;
            const title = typeof token === 'object' ? token.title : arguments[1];
            const text = typeof token === 'object' ? token.text : arguments[2];
            
            // Transform relative paths to use the image function
            let newHref = href;
            if (href && href.startsWith('./')) {
                const imageName = href.substring(2); // Remove './'
                newHref = CONFIG.api.image(post, imageName);
            }
            
            // Update token if it's an object, otherwise pass parameters
            if (typeof token === 'object') {
                token.href = newHref;
                return originalImage(token);
            } else {
                return originalImage(newHref, title, text);
            }
        };
        
        const html = marked.parse(contentWithoutFrontmatter, { renderer }); // Parse with custom renderer
        postContainer.innerHTML = html; // Don't add extra heading since markdown has the title
        
        // Check for commit history placeholder
        const commitPlaceholder = postContainer.querySelector('[data-commit-history]');
        if (commitPlaceholder) {
            const owner = commitPlaceholder.dataset.owner || CONFIG.commitHistory.defaultOwner;
            const repo = commitPlaceholder.dataset.repo || CONFIG.commitHistory.defaultRepo;
            const path = commitPlaceholder.dataset.path || '';
            
            // Create unique ID if not present
            if (!commitPlaceholder.id) {
                commitPlaceholder.id = `commit-viewer-${Date.now()}`;
            }
            
            // Initialize commit viewer
            const viewer = new CommitHistoryViewer(commitPlaceholder.id);
            viewer.initExternal(owner, repo, path);
        }
        
        // Scroll the main element to top
        scrollToTop(document.querySelector('main'));
    }

    // Build the navigation dynamically
    buildNavigation();
});
