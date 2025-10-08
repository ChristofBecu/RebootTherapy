// API service for fetching data from Netlify functions
import { CONFIG } from './config.js';

/**
 * Fetch list of all post names and titles
 * @returns {Promise<Array>} Array of post objects with name and title
 */
export async function fetchPostNames() {
    try {
        const response = await fetch(CONFIG.api.posts);
        if (!response.ok) {
            throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching post names:', error);
        return [];
    }
}

/**
 * Load markdown content for a specific post
 * @param {string} postName - The name of the post to load
 * @returns {Promise<string>} The markdown content
 */
export async function loadMarkdown(postName) {
    try {
        const response = await fetch(CONFIG.api.post(postName));
        if (!response.ok) {
            throw new Error(`Failed to load ${postName}: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error loading markdown for ${postName}:`, error);
        return `# Error\nCould not load the post: ${postName}`;
    }
}
