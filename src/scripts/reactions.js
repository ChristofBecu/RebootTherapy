// Reactions UI component for blog posts
import { CONFIG } from './config.js';

const ALLOWED_EMOJIS = ['👍', '👎', '🤔', '😂'];

export class ReactionsWidget {
    constructor(postSlug, container) {
        this.postSlug = postSlug;
        this.container = container;
        this.reactions = { emojis: {} };
        this.userReactions = this.loadUserReactions();
    }

    /**
     * Load user's reactions from localStorage
     */
    loadUserReactions() {
        try {
            const stored = localStorage.getItem(`reactions_${this.postSlug}`);
            // Return single emoji string or null (user can only have one reaction)
            return stored ? stored : null;
        } catch (error) {
            console.error('Error loading user reactions:', error);
            return null;
        }
    }

    /**
     * Save user's reactions to localStorage
     */
    saveUserReactions() {
        try {
            if (this.userReactions) {
                localStorage.setItem(`reactions_${this.postSlug}`, this.userReactions);
            } else {
                localStorage.removeItem(`reactions_${this.postSlug}`);
            }
        } catch (error) {
            console.error('Error saving user reactions:', error);
        }
    }

    /**
     * Check if user has already reacted with this emoji
     */
    hasUserReacted(emoji) {
        return this.userReactions === emoji;
    }

    /**
     * Initialize the reactions widget
     */
    async init() {
        await this.fetchReactions();
        this.render();
    }

    /**
     * Fetch reactions from the server
     */
    async fetchReactions() {
        try {
            const response = await fetch(`/.netlify/functions/reactions?post=${encodeURIComponent(this.postSlug)}`);
            if (response.ok) {
                this.reactions = await response.json();
            }
        } catch (error) {
            console.error('Error fetching reactions:', error);
        }
    }

    /**
     * Toggle or switch a reaction
     */
    async toggleReaction(emoji) {
        const previousReaction = this.userReactions;
        
        try {
            const response = await fetch(`/.netlify/functions/reactions?post=${encodeURIComponent(this.postSlug)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    emoji,
                    previousEmoji: previousReaction 
                })
            });

            if (response.ok) {
                this.reactions = await response.json();
                
                // If clicking the same emoji, remove it; otherwise switch to new emoji
                if (previousReaction === emoji) {
                    this.userReactions = null;
                } else {
                    this.userReactions = emoji;
                }
                
                this.saveUserReactions();
                this.render();
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);
        }
    }

    /**
     * Render the reactions widget
     */
    render() {
        this.container.innerHTML = '';
        
        const widget = document.createElement('div');
        widget.className = 'reactions-widget';
        
        const title = document.createElement('h3');
        title.className = 'reactions-title';
        title.textContent = 'React to this post';
        widget.appendChild(title);

        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'reactions-emojis';

        ALLOWED_EMOJIS.forEach(emoji => {
            const button = document.createElement('button');
            button.className = 'reaction-button';
            
            const count = this.reactions.emojis[emoji] || 0;
            const hasReacted = this.hasUserReacted(emoji);
            
            if (hasReacted) {
                button.classList.add('reacted');
            }
            
            button.innerHTML = `
                <span class="emoji">${emoji}</span>
                <span class="count">${count}</span>
            `;
            
            button.addEventListener('click', () => {
                this.toggleReaction(emoji);
            });
            
            emojiContainer.appendChild(button);
        });

        widget.appendChild(emojiContainer);
        this.container.appendChild(widget);
    }
}

/**
 * Initialize reactions for a post
 * @param {string} postSlug - The post slug/name
 * @param {HTMLElement} container - The container element
 */
export function initReactions(postSlug, container) {
    const widget = new ReactionsWidget(postSlug, container);
    widget.init();
}
