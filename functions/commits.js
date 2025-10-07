const https = require('https');

const GITHUB_API_BASE = 'https://api.github.com';
const DEFAULT_OWNER = 'ChristofBecu'; // Your GitHub username

function fetchFromGitHub(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'RebootTherapy-App',
        // Optional: Add token for higher rate limits
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    };

    https.get(url, options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API error: ${response.statusCode}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

exports.handler = async function(event, context) {
  try {
    // Get query parameters
    const params = event.queryStringParameters || {};
    const owner = params.owner || DEFAULT_OWNER;
    const repo = params.repo || 'RebootTherapy'; // Default to current repo
    const page = params.page || '1';
    const perPage = params.per_page || '30';
    const filePath = params.path || '';
    const branch = params.branch || ''; // Optional: specific branch
    
    let apiUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}`;
    
    if (filePath) {
      apiUrl += `&path=${encodeURIComponent(filePath)}`;
    }
    
    if (branch) {
      apiUrl += `&sha=${encodeURIComponent(branch)}`;
    }
    
    console.log(`Fetching commits from: ${apiUrl}`);
    
    const commits = await fetchFromGitHub(apiUrl);
    
    // Format the commit data
    const formattedCommits = commits.map(commit => ({
      sha: commit.sha.substring(0, 7),
      fullSha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date,
        avatar: commit.author?.avatar_url
      },
      url: commit.html_url,
      stats: {
        additions: commit.stats?.additions,
        deletions: commit.stats?.deletions
      }
    }));
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300" // 5-minute cache
      },
      body: JSON.stringify({
        commits: formattedCommits,
        repo: { owner, name: repo },
        page: parseInt(page),
        perPage: parseInt(perPage)
      })
    };
    
  } catch (error) {
    console.error('Error fetching commits:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch commits from GitHub',
        details: error.message 
      })
    };
  }
};
