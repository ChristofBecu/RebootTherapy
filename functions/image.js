const fs = require('fs');
const path = require('path');

// Simple MIME type detection
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

exports.handler = async function(event, context) {
  // Get post name and image name from URL path
  // Expected format: /.netlify/functions/image/post-name/image.png
  const pathParts = event.path.split('/').filter(p => p);
  
  // Remove 'functions' and 'image' from path parts
  const relevantParts = pathParts.slice(pathParts.indexOf('image') + 1);
  
  if (relevantParts.length < 2) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Post name and image name are required' })
    };
  }
  
  const postName = relevantParts[0];
  const imageName = relevantParts.slice(1).join('/'); // Support subdirectories
  
  console.log('Request path:', event.path);
  console.log('Post name:', postName);
  console.log('Image name:', imageName);
  
  // Security: prevent directory traversal
  if (imageName.includes('..')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid image name' })
    };
  }
  
  try {
    // Debug: List what's actually available
    console.log('Current working directory:', process.cwd());
    console.log('__dirname:', __dirname);
    console.log('LAMBDA_TASK_ROOT:', process.env.LAMBDA_TASK_ROOT);
    
    // Try to list the content directory to see what's there
    try {
      const contentPath = path.join(__dirname, '..', 'src', 'content', postName);
      console.log(`Trying to list: ${contentPath}`);
      const files = fs.readdirSync(contentPath);
      console.log(`Files in ${postName}:`, files.join(', '));
    } catch (err) {
      console.log(`Could not list directory: ${err.message}`);
    }
    
    // Try multiple possible image locations
    const possiblePaths = [
      // Netlify environment paths
      `/var/task/src/content/${postName}/${imageName}`,
      `/var/task/content/${postName}/${imageName}`,
      process.env.LAMBDA_TASK_ROOT ? `${process.env.LAMBDA_TASK_ROOT}/src/content/${postName}/${imageName}` : null,
      process.env.LAMBDA_TASK_ROOT ? `${process.env.LAMBDA_TASK_ROOT}/content/${postName}/${imageName}` : null,
      // Local development path
      path.join(__dirname, '..', 'src', 'content', postName, imageName),
      path.join(__dirname, '..', 'content', postName, imageName)
    ].filter(Boolean); // Remove null entries
    
    let imageBuffer;
    let imagePath;
    let foundFile = false;
    
    // Try each path until we find one that works
    for (const filePath of possiblePaths) {
      try {
        console.log(`Trying image path: ${filePath}`);
        imageBuffer = fs.readFileSync(filePath);
        imagePath = filePath;
        foundFile = true;
        console.log(`Successfully found image at: ${filePath}`);
        break;
      } catch (error) {
        console.log(`Image ${filePath} not accessible: ${error.message}`);
      }
    }
    
    if (!foundFile) {
      throw new Error(`Could not find image "${imageName}" for post "${postName}"`);
    }
    
    const mimeType = getMimeType(imagePath);
    
    // Return successful response with image
    return {
      statusCode: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    // Return error response
    console.error(`Error reading image ${imageName} for post ${postName}:`, error);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: `Image not found` })
    };
  }
};
