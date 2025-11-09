---
date: 2025-11-09T14:01:00
tags: web development, netlify, serverless, javascript, markdown, pwa
---

# 🏗️📝🚀 Building This Blog: Serverless, Markdown, and Mild Chaos

*Or: How I stopped pretending to have standards and embraced Netlify Functions.*

Welcome to the meta-verse—this is a blog post **about the blog you’re currently reading**. If you’re here, you’re witnessing a fragile tower of questionable decisions, caffeine-fueled refactors, and a deep-rooted refusal to use anything mainstream like WordPress or Ghost. And more, to prevent bloated frameworks from standing between me and the creative flow.

Why reinvent the wheel when a thousand wheels already exist? Because I am a control enthusiast with masochistic tendencies, obviously.

## The Core Philosophy

This site is built on one guiding principle: **Keep it stupid simple—but make the stupidity entirely bespoke.**

No database monsters. No CMS labyrinths. No static site generators demanding 400 npm packages to preview your own typos. Just:

- Markdown files
- Vanilla JavaScript
- Netlify Functions
- A whisper of PWA wizardry

Everything is versioned. Everything deploys ridiculously fast. And everything breaks in weird, poetic ways that only serverless architectures can provide.

## The Architecture (A Love Letter to Minimalism, With a Threatening Undertone)

### Content: Just Markdown

Each post lives in its own little directory inside src/content/, guarding a single index.md file like a dragon hoarding treasure:

```bash
src/content/
├── dotfiles-journey/
│   └── index.md
├── i3-toggle-internal-monitor/
│   └── index.md
└── building-this-blog/
    └── index.md
```

Frontmatter kicks things off:

```markdown
---
date: 2025-11-09T14:30:00
tags: web development, netlify, serverless
---

# Your Brilliant Title Here
```

That’s it. No 12 layers of YAML. No fragile pipeline configs threatening to implode. Just markdown, committed straight to Git.

Images? Dump them next to the markdown. Netlify Functions do the rest. My future self will curse or thank me accordingly.

### The Frontend: A Vanilla JavaScript SPA That Refuses to Die

No frameworks were harmed—or used—during this process.

The core is just ES6 modules doing light gymnastics:

src/index.html is tiny, almost unnervingly so. It:

- Loads a sidebar navigation
- Pulls in posts
- Handles routing in-browser like it’s 2008 again

Key modules:

- **`main.js`** — conductor of this tiny orchestra
- **`api.js`** — speaks to serverless functions
- **`postRenderer.js`** — markdown → HTML via [Marked](https://marked.js.org/)
- **`navigation.js`** — sidebar logic & existential sorting
- **`tagFilter.js`** — filters posts by tags you’ll forget to use
- **`syntaxHighlight.js`** — [Highlight.js](https://highlightjs.org/) for code glow-ups
- **`reactions.js`** — emoji reactions for low-effort dopamine

You click a title, JavaScript:

1. Fetches the raw markdown via Netlify
2. Extracts frontmatter with regex sorcery
3. Renders HTML
4. Highlights code
5. Drops it into the DOM like a newborn

All without page reloads. All with plenty of room for mistakes.

### The Backend: Netlify Functions, a.k.a. Lambda Without the Trauma

Netlify Functions make serverless feel... non-hostile.

Endpoints include:

#### `posts.js` — List All Posts

Reads the directories, grabs frontmatter dates, sorts posts. Done.

```javascript
exports.handler = async function(event, context) {
  const contentDir = '/var/task/src/content';
  const files = fs.readdirSync(contentDir);
  
  const posts = files
    .filter(file => fs.statSync(path.join(contentDir, file)).isDirectory())
    .map(dirName => {
      const content = fs.readFileSync(
        path.join(contentDir, dirName, 'index.md'),
        'utf8'
      );
      
      // Extract date from frontmatter
      const dateMatch = content.match(/date:\s*(.+)/);
      const date = dateMatch ? new Date(dateMatch[1]) : new Date();
      
      return { name: dirName, date, title: extractTitle(content) };
    })
    .sort((a, b) => b.date - a.date);
  
  return { statusCode: 200, body: JSON.stringify(posts) };
};
```

#### `post.js` — Serve Individual Post

Returns raw markdown in all its glory.

```javascript
exports.handler = async function(event, context) {
  const postName = event.queryStringParameters.name;
  const filePath = path.join('/var/task/src/content', postName, 'index.md');
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: content
  };
};
```

#### `image.js` — Because Markdown Images Need Love Too

Base64-encoded images. Yes, it works.

```javascript
exports.handler = async function(event, context) {
  const { post, image } = event.queryStringParameters;
  const imagePath = path.join('/var/task/src/content', post, image);
  
  const imageBuffer = fs.readFileSync(imagePath);
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': getMimeType(image) },
    body: imageBuffer.toString('base64'),
    isBase64Encoded: true
  };
};
```

#### `reactions.js` — Emoji Validation Storage

Powered by Netlify Blobs in production, plain JSON locally.

```javascript
async function readReactions(postSlug, store) {
  if (isProduction) {
    const data = await store.get(postSlug);
    return data ? JSON.parse(data) : { emojis: {} };
  } else {
    // Local file system
    const filePath = path.join(REACTIONS_DIR, `${postSlug}.json`);
    return fs.existsSync(filePath) 
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : { emojis: {} };
  }
}
```

Emoji reactions are persistent. My self-worth is now technically serverless.

#### `commits.js` — Real-Time Commit Stream

Pulls commits from GitHub and spits out HTML.

```html
<div id="commits" 
     data-commit-history 
     data-owner="owner" 
     data-repo="repo">
</div>
```

Perfect for watching your dotfiles descend into chaos.

### Dark Mode Toggle

Because your retinas deserve mercy.

`darkMode.js` flips `.dark-mode` on and off via `localStorage`

```javascript
export function initDarkMode() {
  const darkModeEnabled = localStorage.getItem('darkMode') === 'enabled';
  
  if (darkModeEnabled) {
    document.body.classList.add('dark-mode');
  }
  
  toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isEnabled = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isEnabled ? 'enabled' : 'disabled');
  });
}
```

CSS variables do the heavy lifting.

### Progressive Web App (PWA)

This blog is installable. You can add it to your home screen and pretend it's a native app.

Key parts:

- **`public/manifest.json`** — App metadata (name, icons, theme color)
- **`public/sw.js`** — Service Worker for offline caching

The Service Worker caches static assets and markdown posts so the blog works offline (because who needs the internet, anyway?).

Registration happens in `main.js`:

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/public/sw.js')
    .then(registration => console.log('SW registered:', registration.scope))
    .catch(error => console.error('SW registration failed:', error));
}
```

## The Deployment Pipeline

Netlify watches your Git repo and deploys every push. The flow is:

1. Upload static files
2. Upload functions
3. CDN does its thing
4. HTTPS by default

`netlify.toml` is aggressively simple:

```toml
[build]
  publish = "src"
  functions = "functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

Deploy time: ~10 seconds. Emotionally: timeless.

## The Workflow

1. Write markdown in `src/content/<post-name>/index.md`
2. Add images to the same directory if needed
3. `git add . && git commit -m "feat: new post about some thing"`
4. `git push`
5. Watch Netlify do its wizardry in 10 seconds
6. Post goes live

No bundlers. No compilers. No pipelines written in hieroglyphics.

## What I Learned (The Hard Way)

### Netlify Functions = AWS Lambda in Disguise

File paths are a fever dream.

### Netlify Blobs Are Exceptional

Tiny persistent storage without babysitting a database.

### Vanilla JS Isn’t the Enemy

Just mildly annoying.

### Service Workers Will Betray You

Cache invalidation is pain incarnate.

### Fish Shell Hatred Moment

Heredocs don’t exist. Enough said.

## What's Next?

Probably:

- Full-text search
- RSS feed (for the chosen few)
- Comments (never happening)
- Analytics powered by Blobs
- Serverless OG card generation

Will I implement these? Tune in never.

## The Source Code

Home sweet chaos: [github.com/ChristofBecu/RebootTherapy](https://github.com/ChristofBecu/RebootTherapy)

Steal, fork, improve, yell—whatever fits your energy level

---

**TL;DR:** Markdown + serverless functions + client-side rendering + PWA seasoning = this blog. No database. No build step. No sanity.

But it works. And it’s gloriously ***mine***.
