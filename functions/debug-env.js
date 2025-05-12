const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  try {
    // List of potential directories to check in Netlify environment
    const potentialDirs = [
      '/',
      '/var',
      '/var/task',
      '/var/task/src',
      '/opt',
      '/tmp',
      '.'
    ];
    
    const results = {};
    
    // Check each directory and list contents if available
    for (const dir of potentialDirs) {
      try {
        const files = fs.readdirSync(dir);
        results[dir] = files;
      } catch (error) {
        results[dir] = `Error: ${error.message}`;
      }
    }
    
    // Also log environment variables
    results.environment = {
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: process.env.NETLIFY,
      CONTEXT: process.env.CONTEXT,
      SITE_ID: process.env.SITE_ID,
      PWD: process.env.PWD,
      LAMBDA_TASK_ROOT: process.env.LAMBDA_TASK_ROOT,
      LAMBDA_RUNTIME_DIR: process.env.LAMBDA_RUNTIME_DIR
    };
    
    // Log results
    console.log('Directory scan results:', JSON.stringify(results, null, 2));
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(results)
    };
  } catch (error) {
    console.error('Error scanning directories:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to scan directories' })
    };
  }
};
