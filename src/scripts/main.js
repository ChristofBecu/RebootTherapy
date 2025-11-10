// Main application entry point
import { initDarkMode } from './darkMode.js';
import { parseFrontmatter } from './utils.js';
import { fetchPostNames, loadMarkdown } from './api.js';
import { initNavigation, renderPostList, attachPostClickListener, closeMenuOnMobile } from './navigation.js';
import { renderTagFilter, updateTagButtonStates, collectTags } from './tagFilter.js';
import { renderPost } from './postRenderer.js';

// Application state
let allPosts = [];
let allTags = new Set();
let currentTag = 'all';
let sortedPosts = []; // Store the original sorted posts array

document.addEventListener('DOMContentLoaded', async () => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/public/sw.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // Initialize dark mode
    initDarkMode();

    const postContainer = document.getElementById('blog-content');
    const navList = document.querySelector('nav ul');
    const sidebar = document.querySelector('.nav-container');
    const toggleNavButton = document.getElementById('toggle-nav');
    
    // Initialize navigation
    initNavigation(sidebar, toggleNavButton);

    // Dynamically build the navigation menu
    async function buildNavigation(loadFirstPost = false) {
        const posts = await fetchPostNames();
        
        // Store the sorted posts array (already sorted by date from server)
        sortedPosts = posts;
        
        // Load all posts and collect tags
        for (const post of posts) {
            const markdown = await loadMarkdown(post.name);
            const metadata = parseFrontmatter(markdown);
            allPosts.push({
                name: post.name,
                title: post.title,
                tags: metadata.tags || []
            });
        }
        
        // Collect all unique tags
        allTags = collectTags(allPosts);
        
        // Render tag filter
        renderTagFilter(allTags, filterByTag);
        
        // Attach post click listener once
        attachPostClickListener(navList, (postName) => {
            loadAndRenderPost(postName);
            closeMenuOnMobile(sidebar, toggleNavButton);
        });
        
        // Render post list
        updatePostList();

        // Optionally, load the first post by default
        if (loadFirstPost && posts.length > 0) {
            loadAndRenderPost(posts[0].name);
        }
    }
    
    // Update post list based on filters
    function updatePostList() {
        renderPostList(navList, sortedPosts, allPosts, currentTag);
    }
    
    // Filter posts by tag
    function filterByTag(tag) {
        currentTag = tag;
        updateTagButtonStates(tag);
        updatePostList();
    }

    // Load and render a specific post
    async function loadAndRenderPost(postName) {
        const markdown = await loadMarkdown(postName);
        await renderPost(postName, markdown, postContainer);
    }

    // Build the navigation dynamically
    buildNavigation(true);

    setInterval(() => {
        buildNavigation(false);
    }, 60000); // Refresh every 60 seconds on new posts
});
