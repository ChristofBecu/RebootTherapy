document.addEventListener('DOMContentLoaded', async () => {
    const postContainer = document.getElementById('blog-content');
    const navList = document.querySelector('nav ul');
    const sidebar = document.querySelector('.nav-container'); // Select the navigation menu
    const toggleNavButton = document.getElementById('toggle-nav'); // Select the toggle button

    // Ensure the navigation menu is visible on startup
    sidebar.classList.remove('hidden');

    // Add event listener to toggle the navigation menu
    toggleNavButton.addEventListener('click', () => {
        sidebar.classList.toggle('hidden'); // Toggle the "hidden" class

        // Update button text based on sidebar visibility
        if (sidebar.classList.contains('hidden')) {
            toggleNavButton.textContent = 'Show Posts';
        } else {
            toggleNavButton.textContent = 'Hide Posts';
        }
    });

    // Fetch post names from the server
    async function fetchPostNames() {
        try {
            const response = await fetch('/api/posts');
            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.statusText}`);
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
            const response = await fetch(`content/${post}.md`);
            if (!response.ok) {
                throw new Error(`Failed to load ${post}.md: ${response.statusText}`);
            }
            const text = await response.text();
            return text;
        } catch (error) {
            console.error(error);
            return `# Error\nCould not load the post: ${post}`;
        }
    }

    async function renderPost(post) {
        console.log(`Rendering post: ${post}`);
        const markdown = await loadMarkdown(post);
        const html = marked.parse(markdown); // Assuming marked.js is included for markdown parsing
        console.log(`Rendered HTML: ${html}`);
        postContainer.innerHTML = `<h2>${post}</h2>${html}`;
    }

    // Build the navigation dynamically
    buildNavigation();
});