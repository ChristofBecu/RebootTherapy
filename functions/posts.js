const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  try {
    // Path to content directory relative to the function
    const contentDir = path.join(__dirname, '..', 'src', 'content');
    
    console.log('Content directory path:', contentDir);
    
    // Read the directory
    const files = fs.readdirSync(contentDir);
    
    // Filter and process Markdown files
    const posts = files
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const filePath = path.join(contentDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: path.basename(file, '.md'), // Remove the .md extension
          createdAt: stats.birthtime, // File creation date
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by creation date (newest first)
    
    // Return successful response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(posts)
    };
  } catch (error) {
    // Return error response
    console.error('Error reading content directory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to read content directory' })
    };
  }
};
