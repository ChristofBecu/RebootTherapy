const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  try {
    // Try multiple possible content directory locations
    const possibleDirs = [
      // Netlify environment paths
      '/var/task/src/content',
      '/var/task/content',
      process.env.LAMBDA_TASK_ROOT ? `${process.env.LAMBDA_TASK_ROOT}/src/content` : null,
      process.env.LAMBDA_TASK_ROOT ? `${process.env.LAMBDA_TASK_ROOT}/content` : null,
      // Local development path
      path.join(__dirname, '..', 'src', 'content'),
      path.join(__dirname, '..', 'content')
    ].filter(Boolean); // Remove null entries
    
    let files = [];
    let contentDir;
    let foundDir = false;
    
    // Try each directory until we find one that works
    for (const dir of possibleDirs) {
      try {
        console.log(`Trying directory: ${dir}`);
        files = fs.readdirSync(dir);
        contentDir = dir;
        foundDir = true;
        console.log(`Successfully found content in: ${dir}`);
        break;
      } catch (error) {
        console.log(`Directory ${dir} not accessible: ${error.message}`);
      }
    }
    
    if (!foundDir) {
      throw new Error('Could not find content directory in any of the expected locations');
    }
    
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
