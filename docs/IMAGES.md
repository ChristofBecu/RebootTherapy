# Adding Images to Posts

This guide explains how to add images to your blog posts in RebootTherapy.

## Directory Structure

Each post is now a directory containing:
- `index.md` - The main post content
- Image files (png, jpg, gif, webp, etc.)
- Any other assets specific to that post

Example structure:
```
src/content/
├── my-awesome-post/
│   ├── index.md
│   ├── screenshot.png
│   ├── diagram.jpg
│   └── logo.svg
└── another-post/
    ├── index.md
    └── photo.png
```

## Adding Images to Markdown

### Method 1: Relative Path (Recommended)

Use a relative path from the `index.md` file:

```markdown
![Description of image](./screenshot.png)
```

### Method 2: Using the Image Function

Reference images through the Netlify function:

```markdown
![Description](/.netlify/functions/image/my-awesome-post/screenshot.png)
```

### Method 3: HTML with Captions

For more control, use HTML:

```html
<figure>
  <img src="./diagram.jpg" alt="Architecture diagram">
  <figcaption>Figure 1: System architecture overview</figcaption>
</figure>
```

## Image Best Practices

1. **Optimize images before adding**
   - Use WebP format for better compression
   - Resize images to appropriate dimensions
   - Compress using tools like `imagemagick` or online compressors

2. **Use descriptive filenames**
   - Good: `login-screen-dark-mode.png`
   - Bad: `screenshot1.png`

3. **Always include alt text**
   - Helps with accessibility
   - Improves SEO

4. **Keep images in the post directory**
   - Makes the post self-contained
   - Easy to manage and version control

## Supported Image Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)
- SVG (.svg)
- ICO (.ico)
- BMP (.bmp)

## Example Post with Images

```markdown
---
date: 2025-10-07T10:00:00
---

# My Amazing Tutorial

Here's a screenshot of the interface:

![User interface screenshot](./ui-screenshot.png)

And here's a diagram showing the architecture:

<figure>
  <img src="./architecture.svg" alt="System architecture">
  <figcaption>Figure 1: High-level system architecture</figcaption>
</figure>

The image will be automatically styled with:
- Responsive sizing (max-width: 100%)
- Rounded corners
- Subtle shadow
- Proper spacing
```

## Testing Locally

When running `npm start`, the Netlify dev server will:
1. Load the `image` function to serve images
2. Serve images from post directories
3. Apply proper MIME types and caching headers

## Deployment

When deploying to Netlify:
1. All images in post directories are included via `netlify.toml` configuration
2. Images are cached for one year (max-age=31536000)
3. The image function handles serving with proper headers

## Troubleshooting

### Image not showing

1. Check the file exists in the post directory
2. Verify the filename matches exactly (case-sensitive)
3. Check browser console for 404 errors
4. Ensure the image format is supported

### Image too large

1. Compress the image before adding
2. Consider using WebP format
3. Resize to appropriate dimensions

### Path issues

- Use `./filename.png` for relative paths
- Don't use `../` to navigate up directories
- Keep images in the same directory as `index.md`
