const fs = require('fs');
const path = require('path');

// Import Netlify Blobs
let getStore;
try {
  getStore = require('@netlify/blobs').getStore;
  console.log('Successfully loaded @netlify/blobs');
} catch (error) {
  console.error('Failed to load @netlify/blobs:', error.message);
  getStore = null;
}

// Directory to store reaction data (for local development)
const REACTIONS_DIR = path.join(__dirname, '..', 'data', 'reactions');

// Check if we're running in production (Netlify)
// Netlify sets AWS_LAMBDA_FUNCTION_NAME when running in their environment
const isProduction = !!process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY === 'true';

// Ensure reactions directory exists (local only)
function ensureReactionsDir() {
  if (!fs.existsSync(REACTIONS_DIR)) {
    fs.mkdirSync(REACTIONS_DIR, { recursive: true });
  }
}

// Get reaction file path for a post (local only)
function getReactionFilePath(postSlug) {
  return path.join(REACTIONS_DIR, `${postSlug}.json`);
}

// Read reactions for a post
async function readReactions(postSlug, store) {
  if (isProduction) {
    if (!store) {
      console.error('Production environment detected but Blobs store not provided');
      return { emojis: {} };
    }
    // Use Netlify Blobs in production
    try {
      const data = await store.get(postSlug);
      return data ? JSON.parse(data) : { emojis: {} };
    } catch (error) {
      console.error('Error reading from Netlify Blobs:', error);
      console.error('Error details:', error.message, error.stack);
      return { emojis: {} };
    }
  } else {
    // Use filesystem for local development
    const filePath = getReactionFilePath(postSlug);
    
    if (!fs.existsSync(filePath)) {
      return { emojis: {} };
    }
    
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading reactions:', error);
      return { emojis: {} };
    }
  }
}

// Write reactions for a post
async function writeReactions(postSlug, reactions, store) {
  if (isProduction) {
    if (!store) {
      console.error('Production environment detected but Blobs store not provided');
      throw new Error('Storage backend not available in production');
    }
    // Use Netlify Blobs in production
    try {
      await store.set(postSlug, JSON.stringify(reactions));
      return true;
    } catch (error) {
      console.error('Error writing to Netlify Blobs:', error);
      console.error('Error details:', error.message, error.stack);
      return false;
    }
  } else {
    // Use filesystem for local development
    ensureReactionsDir();
    const filePath = getReactionFilePath(postSlug);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(reactions, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing reactions:', error);
      return false;
    }
  }
}


// Validate emoji (basic check)
function isValidEmoji(emoji) {
  // Allow common reaction emojis
  const allowedEmojis = ['👍', '👎', '🤔', '😂', '❤️', '🎉', '🚀', '🔥', '👏', '💯', '✨'];
  return allowedEmojis.includes(emoji);
}

exports.handler = async function(event, context) {
  // Debug: Log environment detection
  console.log('Environment check:', {
    AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
    NETLIFY: process.env.NETLIFY,
    NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID ? 'present' : 'missing',
    NETLIFY_SITE_ID_length: process.env.NETLIFY_SITE_ID ? process.env.NETLIFY_SITE_ID.length : 0,
    isProduction,
    hasGetStore: !!getStore,
    hasContext: !!context,
    hasSiteId: !!(context && context.site && context.site.id),
    contextKeys: context ? Object.keys(context) : []
  });

  // Create Blobs store in handler (CRITICAL: must be done here, not outside!)
  // In Lambda, we must explicitly pass siteID and token
  let store = null;
  if (isProduction && getStore) {
    try {
      console.log('Initializing Blobs store inside handler');
      
      // Check for Netlify-provided environment variables
      // Note: For Blobs access, we need a personal access token (NETLIFY_BLOBS_TOKEN)
      // NETLIFY_FUNCTIONS_TOKEN is for internal function auth, not Blobs API
      const siteID = process.env.NETLIFY_SITE_ID;
      const token = process.env.NETLIFY_BLOBS_TOKEN;
      
      console.log('Environment variables:', {
        hasSiteID: !!siteID,
        hasToken: !!token
      });
      
      if (!siteID || !token) {
        console.error('Missing required environment variables for Blobs');
        console.error('Need NETLIFY_SITE_ID and NETLIFY_BLOBS_TOKEN (personal access token)');
      } else {
        store = getStore({
          name: 'reactions',
          siteID: siteID,
          token: token
        });
        console.log('Blobs store initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Blobs store:', error);
    }
  }

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const postSlug = event.queryStringParameters?.post;

  if (!postSlug) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Post slug is required' })
    };
  }

  // GET: Retrieve reactions
  if (event.httpMethod === 'GET') {
    const reactions = await readReactions(postSlug, store);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(reactions)
    };
  }

  // POST: Add or toggle a reaction
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const { emoji, previousEmoji } = body;

      if (!emoji || !isValidEmoji(emoji)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid or missing emoji' })
        };
      }

      // Read current reactions
      const reactions = await readReactions(postSlug, store);

      // Initialize emojis object if it doesn't exist
      if (!reactions.emojis) {
        reactions.emojis = {};
      }

      // If user had a previous reaction, decrement it
      if (previousEmoji && isValidEmoji(previousEmoji)) {
        reactions.emojis[previousEmoji] = Math.max(0, (reactions.emojis[previousEmoji] || 0) - 1);
      }

      // If clicking the same emoji, just remove it (already decremented above)
      // Otherwise, increment the new emoji
      if (emoji !== previousEmoji) {
        reactions.emojis[emoji] = (reactions.emojis[emoji] || 0) + 1;
      }

      // Write updated reactions
      const success = await writeReactions(postSlug, reactions, store);

      if (!success) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to save reaction' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(reactions)
      };

    } catch (error) {
      console.error('Error processing reaction:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Internal server error', message: error.message })
      };
    }
  }

  // Method not allowed
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
