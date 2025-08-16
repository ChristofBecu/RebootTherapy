# My Blog Website

Welcome to My Blog Website! This project is a simple blog platform built using HTML, CSS, and JavaScript, with content written in Markdown. Below you will find instructions on how to set up and run the project, as well as an overview of its structure.

## Project Structure

```
my-blog-website
├── content
│   ├── post1.md
│   ├── post2.md
│   └── post3.md
├── public
│   └── styles.css
├── src
│   ├── index.html
│   └── scripts
│       └── main.js
├── package.json
└── README.md
```

- **content/**: This directory contains the Markdown files for each blog post.
- **public/**: This directory holds the CSS file that styles the blog website.
- **src/**: This directory contains the main HTML file and JavaScript code for the website.
- **package.json**: This file manages project dependencies and scripts.
- **README.md**: This file provides documentation for the project.

## Setup Instructions

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd my-blog-website
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the project**:

```bash
   npm start
   ```

   This will start Netlify dev, which serves both your static files and Netlify Functions locally.
   Then open your browser and navigate to the URL shown in the terminal (usually <http://localhost:8888>).

## Deployment to Netlify

This project can be deployed to Netlify using Netlify Functions to handle the backend API:

1. **Connect your GitHub repository to Netlify**:
   - Push your code to GitHub
   - Sign in to Netlify and click "New site from Git"
   - Select your repository and follow the setup instructions

2. **Configure build settings**:
   - Build command: (leave blank)
   - Publish directory: `src`
   - The `netlify.toml` file already includes the necessary configuration for redirecting API requests to Netlify Functions

3. **Deploy your site**:
   - Click "Deploy site"
   - Netlify will build and deploy your site with the serverless function

4. **Local development with Netlify Functions**:
   - Install Netlify CLI: `npm install -g netlify-cli`
   - Run locally: `netlify dev`

## Usage

- The blog posts are written in Markdown format and are located in the `content` directory.
- The main HTML file is `src/index.html`, which includes links to the CSS and JavaScript files.
- The JavaScript file `src/scripts/main.js` handles loading and rendering the Markdown content.

Feel free to modify the content and styles to suit your needs. Happy blogging!
