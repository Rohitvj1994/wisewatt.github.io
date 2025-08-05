# WiseWatt Blog Submission Setup Guide

## Overview
This implementation provides a secure private blog submission workflow that allows the site owner to publish blog posts directly to the GitHub repository via a hidden form interface.

## Features
- **Hidden Access**: Submit Blog button appears only after typing the correct passkey (`28247340@wisewatt`)
- **Dual Input Methods**: Support for both text editor and .docx file upload
- **Automatic Publishing**: Blogs are committed to GitHub and themed pages are auto-updated
- **Security**: Passkey authentication prevents unauthorized submissions

## Setup Instructions

### 1. Netlify Deployment
1. Deploy this repository to Netlify
2. Ensure the site builds successfully

### 2. GitHub Token Setup
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with the following permissions:
   - `repo` (full repository access)
   - `contents:write` (to create/modify files)
3. Copy the generated token

### 3. Netlify Environment Variables
1. In your Netlify dashboard, go to Site settings → Environment variables
2. Add a new environment variable:
   - **Key**: `GITHUB_TOKEN`
   - **Value**: Your GitHub personal access token from step 2
3. Save the configuration

### 4. Redeploy
1. Trigger a new deployment to ensure the environment variable is loaded
2. The Netlify functions will now have access to the GitHub API

## Usage Instructions

### Accessing the Submit Form
1. Visit your site's homepage
2. Type the passkey: `28247340@wisewatt`
3. The "Submit Blog" button will appear in the bottom-right corner
4. Click the button to open the submission form

### Submitting a Blog Post
1. **Title**: Enter your blog post title
2. **Theme**: Select from available themes (policy, tech, trends, global, critical, AI)
3. **Content**: Choose either:
   - Text Editor: Write directly in the textarea
   - Upload .docx: Upload a Word document (automatically converted)
4. **Passkey**: Enter the same passkey for verification
5. Click "Submit Blog Post"

### What Happens After Submission
1. Blog post is created in `blogs/{theme}/YYYY-MM-DD.html`
2. The corresponding themed page is automatically updated with a link to the new blog
3. Changes are committed to the GitHub repository
4. Site rebuilds automatically on GitHub Pages

## File Structure
```
/
├── index.html (modified with hidden button)
├── submit-blog.html (submission form)
├── submit.js (client-side logic)
├── secrets.js (passkey storage)
├── netlify/functions/publish-blog.js (GitHub API integration)
├── blogs/
│   ├── policy/ (policy blog posts)
│   ├── tech/ (tech blog posts)
│   ├── trends/ (trends blog posts)
│   ├── global/ (global blog posts)
│   ├── critical/ (critical minerals blog posts)
│   └── AI/ (AI blog posts)
└── [theme].html files (auto-updated with blog links)
```

## Security Notes
- The passkey is stored in `secrets.js` for client-side validation
- GitHub token is stored securely in Netlify environment variables
- Only authorized users with the passkey can submit blogs
- All submissions require passkey verification

## Troubleshooting

### Blog Submission Fails
1. Check Netlify function logs for errors
2. Verify GitHub token has correct permissions
3. Ensure environment variable `GITHUB_TOKEN` is set correctly

### Submit Button Doesn't Appear
1. Ensure you're typing the exact passkey: `28247340@wisewatt`
2. Try refreshing the page and typing again
3. Check browser console for JavaScript errors

### .docx Upload Issues
1. Ensure file is a valid .docx format
2. Check file size (large files may timeout)
3. Try using the text editor instead