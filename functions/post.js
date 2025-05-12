const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  // Get post name from URL path
  const pathParts = event.path.split('/');
  const postName = pathParts[pathParts.length - 1];
  
  console.log('Request path:', event.path);
  console.log('Extracted post name:', postName);
  
  if (!postName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Post name is required' })
    };
  }
  
  try {
    // Path to content directory relative to the function
    const contentPath = path.join(__dirname, '..', 'src', 'content', `${postName}.md`);
    
    // Read the file
    const content = fs.readFileSync(contentPath, 'utf-8');
    
    // Return successful response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/markdown"
      },
      body: content
    };
  } catch (error) {
    // Return error response
    console.error(`Error reading post ${postName}:`, error);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: `Post "${postName}" not found` })
    };
  }
};
