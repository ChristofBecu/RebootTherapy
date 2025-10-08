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
    // Initialize dark mode
    initDarkMode();

    const postContainer = document.getElementById('blog-content');
    const navList = document.querySelector('nav ul');
    const sidebar = document.querySelector('.nav-container');
    const toggleNavButton = document.getElementById('toggle-nav');
    
    // Initialize navigation
    initNavigation(sidebar, toggleNavButton);

    // Dynamically build the navigation menu
    async function buildNavigation() {
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
        if (posts.length > 0) {
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
    buildNavigation();
});
