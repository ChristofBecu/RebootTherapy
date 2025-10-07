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

    // Ensure the navigation menu is visible on startup
    sidebar.classList.remove('hidden');

    // Update button text to use icons - show X since menu is visible
    toggleNavButton.innerHTML = '✕';

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
            link.setAttribute('data-post', post.name); // Use the name property
            link.textContent = post.name.replace('post', 'Post '); // Format the name (e.g., "post1" -> "Post 1")
            listItem.appendChild(link);
            navList.appendChild(listItem);
        });

        // Attach event listeners to dynamically created links
        navList.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                const post = event.target.getAttribute('data-post');
                renderPost(post);
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
        const html = marked.parse(markdown); // Assuming marked.js is included for markdown parsing
        postContainer.innerHTML = `<h2>${post}</h2>${html}`;
    }

    // Build the navigation dynamically
    buildNavigation();
});
