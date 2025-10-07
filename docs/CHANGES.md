# Image Support Implementation Summary

## Changes Made

### 1. Restructured Content Directory
- **Before**: Each post was a single `.md` file in `src/content/`
- **After**: Each post is a directory containing `index.md` and any images

Example:
```
src/content/
├── fish-right-prompt-linux-kernel-performance/
│   └── index.md
├── i3-toggle-internal-monitor/
│   └── index.md
└── i3lock-password-issue/
    └── index.md
```

### 2. Updated Serverless Functions

#### `functions/posts.js`
- Changed to read directories instead of `.md` files
- Now looks for `index.md` within each directory
- Filters for directories using `fs.statSync().isDirectory()`

#### `functions/post.js`
- Updated paths to read from `{postName}/index.md` instead of `{postName}.md`
- Maintains all existing fallback paths for different deployment environments

#### `functions/image.js` (NEW)
- New serverless function to serve images from post directories
- Handles MIME type detection for various image formats
- Includes security checks to prevent directory traversal
- Serves images with proper caching headers (1 year)
- Supports: PNG, JPEG, GIF, WebP, SVG, ICO, BMP

### 3. Updated Netlify Configuration

Modified `netlify.toml`:
```toml
[functions]
  included_files = [
    "src/content/**/index.md",
    "src/content/**/*.png",
    "src/content/**/*.jpg",
    "src/content/**/*.jpeg",
    "src/content/**/*.gif",
    "src/content/**/*.webp",
    "src/content/**/*.svg"
  ]
```

This ensures all images are included in the Netlify deployment.

### 4. Added Image Styling

Added to `src/public/styles.css`:
- Responsive image sizing (max-width: 100%)
- Rounded corners and shadows
- Dark mode support
- Figure and figcaption styling for captions

### 5. Documentation

Created `docs/IMAGES.md` with:
- How to add images to posts
- Best practices
- Examples
- Troubleshooting guide

## How to Use

### Adding an Image to a Post

1. Place your image in the post's directory:
   ```bash
   cp screenshot.png src/content/my-post/
   ```

2. Reference it in your `index.md`:
   ```markdown
   ![Screenshot](./screenshot.png)
   ```

### Alternative Methods

**Using the image function:**
```markdown
![Screenshot](/.netlify/functions/image/my-post/screenshot.png)
```

**With captions:**
```html
<figure>
  <img src="./diagram.png" alt="Diagram">
  <figcaption>Figure 1: System overview</figcaption>
</figure>
```

## Testing

The local development server (`npm start`) successfully:
- ✅ Loads all three posts from new directory structure
- ✅ Serves post content from `index.md` files
- ✅ Loads the new `image` function
- ✅ Maintains correct date sorting

## Benefits

1. **Better Organization**: Each post is self-contained with its assets
2. **Version Control**: Easy to track which images belong to which post
3. **Scalability**: No shared image directory that grows indefinitely
4. **Portability**: Posts can be moved/copied with all their assets
5. **Maintainability**: Easy to delete a post and all its images

## Next Steps

To add images to an existing post:

1. Add image files to the post directory
2. Reference them in the markdown using relative paths
3. Commit and deploy

Example:
```bash
# Add an image
cp ~/Downloads/screenshot.png src/content/my-post/

# Reference in markdown
echo "\n![My Screenshot](./screenshot.png)\n" >> src/content/my-post/index.md

# Commit
git add src/content/my-post/
git commit -m "Add screenshot to my-post"
```

## Deployment Checklist

Before deploying:
- ✅ Posts restructured into directories
- ✅ Functions updated to read from new structure
- ✅ Image function created
- ✅ Netlify config updated
- ✅ CSS styling added
- ✅ Local testing passed

Ready to deploy! 🚀
