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
        const posts = await fetchPostNames(); // Fetch the array of post objects
        posts.forEach(post => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.setAttribute('data-post', post.name); // Use the name property for the URL
            link.textContent = post.title; // Display the title
            listItem.appendChild(link);
            navList.appendChild(listItem);
        });

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
        
        const html = marked.parse(markdown, { renderer }); // Parse with custom renderer
        postContainer.innerHTML = html; // Don't add extra heading since markdown has the title
        
        // Scroll the main element (which has overflow-y: auto) to top
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.scrollTop = 0;
        }
    }

    // Build the navigation dynamically
    buildNavigation();
});
