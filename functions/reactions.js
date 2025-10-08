const fs = require('fs');
const path = require('path');

// Directory to store reaction data
const REACTIONS_DIR = path.join(__dirname, '..', 'data', 'reactions');

// Ensure reactions directory exists
function ensureReactionsDir() {
  if (!fs.existsSync(REACTIONS_DIR)) {
    fs.mkdirSync(REACTIONS_DIR, { recursive: true });
  }
}

// Get reaction file path for a post
function getReactionFilePath(postSlug) {
  return path.join(REACTIONS_DIR, `${postSlug}.json`);
}

// Read reactions for a post
function readReactions(postSlug) {
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

// Write reactions for a post
function writeReactions(postSlug, reactions) {
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

// Validate emoji (basic check)
function isValidEmoji(emoji) {
  // Allow common reaction emojis
  const allowedEmojis = ['👍', '👎', '🤔', '😂', '❤️', '🎉', '🚀', '🔥', '👏', '💯', '✨'];
  return allowedEmojis.includes(emoji);
}

exports.handler = async function(event, context) {
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
    const reactions = readReactions(postSlug);
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
      const reactions = readReactions(postSlug);

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
      const success = writeReactions(postSlug, reactions);

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
        body: JSON.stringify({ error: 'Internal server error' })
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
