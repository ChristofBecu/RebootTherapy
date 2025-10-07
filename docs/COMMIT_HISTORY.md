# Commit History Feature

This feature allows you to embed live GitHub commit history into any blog post.

## How It Works

1. **Netlify Function** (`functions/commits.js`): Fetches commit data from GitHub API
2. **JavaScript Component** (`src/scripts/commits.js`): Renders the commit history with pagination
3. **Markdown Integration**: Detects special HTML placeholders in rendered posts and initializes viewers

## Usage in Markdown Posts

To add commit history to any blog post, simply add this HTML div in your markdown:

```markdown
# My Post Title

Some content here...

<div id="unique-id" data-commit-history data-owner="ChristofBecu" data-repo="dotfiles"></div>

More content here...
```

### Data Attributes

- `data-commit-history` (required): Marks this div as a commit history viewer
- `data-owner` (optional): GitHub username (defaults to "ChristofBecu")
- `data-repo` (optional): Repository name (defaults to "dotfiles")
- `data-path` (optional): Filter commits by specific file path
- `id` (optional): Unique identifier (auto-generated if not provided)

## Example Posts

### Example 1: Dotfiles History

```markdown
<div id="my-dotfiles" data-commit-history data-owner="ChristofBecu" data-repo="dotfiles"></div>
```

### Example 2: Specific File History

```markdown
<div id="bashrc-history" data-commit-history data-owner="ChristofBecu" data-repo="dotfiles" data-path=".bashrc"></div>
```

### Example 3: Another Repository

```markdown
<div id="project-commits" data-commit-history data-owner="ChristofBecu" data-repo="my-awesome-project"></div>
```

## Features

- ✅ Real-time data from GitHub API
- ✅ Automatic pagination (20 commits per page)
- ✅ Responsive design with dark mode support
- ✅ Shows commit message, author, avatar, and date
- ✅ Relative time formatting (e.g., "2 days ago")
- ✅ Direct links to GitHub commits
- ✅ 5-minute cache for better performance
- ✅ Works with any public GitHub repository

## API Rate Limits

GitHub API has rate limits:
- **Unauthenticated**: 60 requests per hour
- **Authenticated**: 5,000 requests per hour

To increase rate limits, add a GitHub token to Netlify environment variables:

1. Generate a GitHub Personal Access Token (no special permissions needed for public repos)
2. Add to Netlify: Site settings → Environment variables → Add variable
   - Key: `GITHUB_TOKEN`
   - Value: Your token
3. Redeploy the site

Then update `functions/commits.js` to use it (line 13 is already prepared, just uncomment).

## Styling

All styles are in `src/public/styles.css` under the "Commit History Styles" section. The component includes:

- Dark mode support
- Responsive design
- Hover effects
- Loading spinner
- Error states
- Pagination controls

## Testing Locally

1. Start Netlify Dev:
   ```bash
   netlify dev
   ```

2. Navigate to your blog post with commit history

3. The function will be available at `/.netlify/functions/commits`

## Files Involved

- `functions/commits.js` - Netlify serverless function
- `src/scripts/commits.js` - Frontend commit viewer component
- `src/scripts/main.js` - Integration with markdown rendering
- `src/public/styles.css` - Styling (search for "Commit History Styles")
- `src/index.html` - Script includes

## Troubleshooting

### Commits not loading?
- Check browser console for errors
- Verify repository name and owner are correct
- Check that repository is public
- Look at Netlify function logs

### Rate limit errors?
- Add a GitHub token (see API Rate Limits section)
- Increase cache time in `functions/commits.js`

### Styling issues?
- Check that `styles.css` is properly loaded
- Verify dark mode class is toggling correctly
- Inspect elements in browser dev tools
