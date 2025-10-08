// Application configuration constants
export const CONFIG = {
    // API endpoints
    api: {
        posts: '.netlify/functions/posts',
        post: (name) => `/.netlify/functions/post/${encodeURIComponent(name)}`,
        image: (post, imageName) => `/.netlify/functions/image/${encodeURIComponent(post)}/${encodeURIComponent(imageName)}`
    },
    
    // UI breakpoints
    breakpoints: {
        mobile: '(max-width: 768px)'
    },
    
    // Theme settings
    theme: {
        storageKey: 'theme',
        defaultTheme: 'dark'
    },
    
    // Commit history defaults
    commitHistory: {
        defaultOwner: 'ChristofBecu',
        defaultRepo: 'dotfiles'
    },
    
    // UI icons
    icons: {
        menuOpen: '☰',
        menuClose: '✕',
        themeDark: '☀️',
        themeLight: '🌙'
    }
};
