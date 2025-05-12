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
    // Try multiple possible content file locations
    const possiblePaths = [
      // Netlify environment paths
      `/var/task/src/content/${postName}.md`,
      `/var/task/content/${postName}.md`,
      process.env.LAMBDA_TASK_ROOT ? `${process.env.LAMBDA_TASK_ROOT}/src/content/${postName}.md` : null,
      process.env.LAMBDA_TASK_ROOT ? `${process.env.LAMBDA_TASK_ROOT}/content/${postName}.md` : null,
      // Local development path
      path.join(__dirname, '..', 'src', 'content', `${postName}.md`),
      path.join(__dirname, '..', 'content', `${postName}.md`)
    ].filter(Boolean); // Remove null entries
    
    let content;
    let contentPath;
    let foundFile = false;
    
    // Try each path until we find one that works
    for (const filePath of possiblePaths) {
      try {
        console.log(`Trying file path: ${filePath}`);
        content = fs.readFileSync(filePath, 'utf-8');
        contentPath = filePath;
        foundFile = true;
        console.log(`Successfully found file at: ${filePath}`);
        break;
      } catch (error) {
        console.log(`File ${filePath} not accessible: ${error.message}`);
      }
    }
    
    if (!foundFile) {
      throw new Error(`Could not find post "${postName}" in any of the expected locations`);
    }
    
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
