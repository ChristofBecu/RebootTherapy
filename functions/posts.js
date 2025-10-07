const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  try {
    // Netlify deploys to /var/task/ and includes your entire repo
    const possibleDirs = [
      // In Netlify deployment, your repo root is at /var/task/
      '/var/task/src/content',
      '/var/task/content',
      // Fallback for local development
      path.join(__dirname, '..', 'src', 'content'),
      path.join(__dirname, '..', 'content'),
      // Additional fallbacks
      path.join(process.cwd(), 'src', 'content'),
      path.join(process.cwd(), 'content')
    ];
    
    let files = [];
    let contentDir;
    let foundDir = false;
    
    // Debug: Log current working directory and available files
    console.log(`Current working directory: ${process.cwd()}`);
    console.log(`Function directory: ${__dirname}`);
    
    try {
      const rootFiles = fs.readdirSync('/var/task/');
      console.log(`Files in /var/task/: ${rootFiles.join(', ')}`);
      
      if (fs.existsSync('/var/task/src')) {
        const srcFiles = fs.readdirSync('/var/task/src');
        console.log(`Files in /var/task/src/: ${srcFiles.join(', ')}`);
      }
    } catch (debugError) {
      console.log(`Debug error: ${debugError.message}`);
    }
    
    // Try each directory until we find one that works
    for (const dir of possibleDirs) {
      try {
        console.log(`Trying directory: ${dir}`);
        if (fs.existsSync(dir)) {
          files = fs.readdirSync(dir);
          contentDir = dir;
          foundDir = true;
          console.log(`Successfully found content in: ${dir}`);
          console.log(`Files found: ${files.join(', ')}`);
          break;
        } else {
          console.log(`Directory ${dir} does not exist`);
        }
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
          name: path.basename(file, '.md'),
          createdAt: stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(posts)
    };
  } catch (error) {
    console.error('Error reading content directory:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        error: 'Failed to read content directory',
        details: error.message 
      })
    };
  }
};
