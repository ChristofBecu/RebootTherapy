// Dark mode toggle functionality
function initDarkMode() {
    const toggleButton = document.createElement('button');
    toggleButton.className = 'theme-toggle';
    toggleButton.setAttribute('aria-label', 'Toggle dark mode');
    toggleButton.innerHTML = '🌙';
    document.body.appendChild(toggleButton);

    // Check for saved theme preference or default to dark mode
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleButton.innerHTML = '☀️';
    }

    toggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        toggleButton.innerHTML = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// Global variables for tag management
let allPosts = [];
let allTags = new Set();
let currentTag = 'all';

// Parse frontmatter to extract metadata including tags
function parseFrontmatter(markdown) {
    // Use the same regex pattern that works in posts.js
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

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize dark mode
    initDarkMode();

    const postContainer = document.getElementById('blog-content');
    const navList = document.querySelector('nav ul');
    const sidebar = document.querySelector('.nav-container'); // Select the navigation menu
    const toggleNavButton = document.getElementById('toggle-nav'); // Select the toggle button

    // Function to check if we're on mobile
    const isMobileView = () => window.matchMedia('(max-width: 768px)').matches;
    
    // Initialize menu state based on device
    function initializeMenuState() {
        if (isMobileView()) {
            sidebar.classList.add('hidden');
            toggleNavButton.innerHTML = '☰';
        } else {
            sidebar.classList.remove('hidden');
            toggleNavButton.innerHTML = '✕';
        }
    }
    
    initializeMenuState();

    // Add event listener to toggle the navigation menu
    toggleNavButton.addEventListener('click', () => {
        sidebar.classList.toggle('hidden'); // Toggle the "hidden" class

        // Update button icon based on sidebar visibility
        if (sidebar.classList.contains('hidden')) {
            toggleNavButton.innerHTML = '☰';
        } else {
            toggleNavButton.innerHTML = '✕';
        }
    });

    // Fetch post names from the server
    async function fetchPostNames() {
        try {
            const response = await fetch('.netlify/functions/posts'); // Use Netlify Function
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
                    toggleNavButton.innerHTML = '☰';
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
            const response = await fetch(`/.netlify/functions/post/${encodeURIComponent(post)}`); // Use Netlify Function
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
                newHref = `/.netlify/functions/image/${encodeURIComponent(post)}/${encodeURIComponent(imageName)}`;
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
            const owner = commitPlaceholder.dataset.owner || 'ChristofBecu';
            const repo = commitPlaceholder.dataset.repo || 'dotfiles';
            const path = commitPlaceholder.dataset.path || '';
            
            // Create unique ID if not present
            if (!commitPlaceholder.id) {
                commitPlaceholder.id = `commit-viewer-${Date.now()}`;
            }
            
            // Initialize commit viewer
            const viewer = new CommitHistoryViewer(commitPlaceholder.id);
            viewer.initExternal(owner, repo, path);
        }
        
        // Scroll the main element (which has overflow-y: auto) to top
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.scrollTop = 0;
        }
    }

    // Build the navigation dynamically
    buildNavigation();
});
