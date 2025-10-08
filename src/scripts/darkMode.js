// Dark mode toggle functionality
import { CONFIG } from './config.js';

/**
 * Initialize dark mode toggle button and handle theme switching
 */
export function initDarkMode() {
    const toggleButton = createToggleButton();
    const currentTheme = getCurrentTheme();
    
    applyTheme(currentTheme, toggleButton);
    attachToggleListener(toggleButton);
}

/**
 * Create the theme toggle button
 */
function createToggleButton() {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle dark mode');
    button.innerHTML = CONFIG.icons.themeLight;
    document.body.appendChild(button);
    return button;
}

/**
 * Get current theme from localStorage or use default
 */
function getCurrentTheme() {
    return localStorage.getItem(CONFIG.theme.storageKey) || CONFIG.theme.defaultTheme;
}

/**
 * Apply theme to page
 */
function applyTheme(theme, toggleButton) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleButton.innerHTML = CONFIG.icons.themeDark;
    } else {
        document.body.classList.remove('dark-mode');
        toggleButton.innerHTML = CONFIG.icons.themeLight;
    }
}

/**
 * Attach click listener to toggle button
 */
function attachToggleListener(toggleButton) {
    toggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        toggleButton.innerHTML = isDark ? CONFIG.icons.themeDark : CONFIG.icons.themeLight;
        localStorage.setItem(CONFIG.theme.storageKey, isDark ? 'dark' : 'light');
    });
}
