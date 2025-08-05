// Netlify function to publish blog posts via GitHub API
const { Octokit } = require('@octokit/rest');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    const { title, theme, content, passkey } = JSON.parse(event.body);

    // Validate passkey
    const PASSKEY = "28247340@wisewatt";
    if (passkey !== PASSKEY) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Invalid passkey' })
      };
    }

    // Validate required fields
    if (!title || !theme || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields' })
      };
    }

    // Initialize GitHub API client
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    const owner = 'Rohitvj1994';
    const repo = 'wisewatt.github.io';
    
    // Generate date-based filename
    const date = new Date();
    const dateString = date.toISOString().split('T')[0];
    const fileName = `${dateString}.html`;
    const filePath = `blogs/${theme}/${fileName}`;

    // Create blog HTML content
    const blogHtml = generateBlogHtml(title, content, date);

    try {
      // Try to get existing file to check if it exists
      await octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath
      });
      
      // If file exists, append timestamp to make it unique
      const timestamp = date.getTime();
      const uniqueFileName = `${dateString}-${timestamp}.html`;
      const uniqueFilePath = `blogs/${theme}/${uniqueFileName}`;
      
      // Create the blog file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: uniqueFilePath,
        message: `feat: add new blog post "${title}"`,
        content: Buffer.from(blogHtml).toString('base64')
      });

      // Update the themed page with new blog link
      await updateThemedPage(octokit, owner, repo, theme, title, uniqueFilePath, date);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Blog published successfully',
          blogUrl: `https://${owner}.github.io/${uniqueFilePath}`
        })
      };

    } catch (error) {
      if (error.status === 404) {
        // File doesn't exist, create it
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: `feat: add new blog post "${title}"`,
          content: Buffer.from(blogHtml).toString('base64')
        });

        // Update the themed page with new blog link
        await updateThemedPage(octokit, owner, repo, theme, title, filePath, date);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Blog published successfully',
            blogUrl: `https://${owner}.github.io/${filePath}`
          })
        };
      }
      throw error;
    }

  } catch (error) {
    console.error('Error publishing blog:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message 
      })
    };
  }
};

function generateBlogHtml(title, content, date) {
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 700px;
      margin: 2rem auto;
      padding: 1rem;
      background: #f9f9f9;
      line-height: 1.6;
    }
    h1 { color: #007acc; }
    a { color: #007acc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    em { color: #555; }
    .date { color: #666; margin-bottom: 1rem; }
    .back-link { margin-bottom: 2rem; }
  </style>
</head>
<body>
  <div class="back-link">
    <a href="../../index.html">← Back to Home</a>
  </div>
  <h1>${title}</h1>
  <div class="date">${formattedDate}</div>
  <div class="content">
    ${content}
  </div>
</body>
</html>`;
}

async function updateThemedPage(octokit, owner, repo, theme, title, filePath, date) {
  const themedPagePath = `${theme}.html`;
  
  try {
    // Get current themed page content
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: themedPagePath
    });

    const currentContent = Buffer.from(fileData.content, 'base64').toString();
    
    // Format date for display
    const displayDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    const blogLink = `    <li><a href="${filePath}">${displayDate}: ${title}</a></li>`;
    
    let updatedContent;
    
    // Check if "Recent Blogs" section exists
    if (currentContent.includes('<h2>Recent Blogs</h2>')) {
      // Add to existing list
      const ulRegex = /(<h2>Recent Blogs<\/h2>\s*<ul>)/;
      updatedContent = currentContent.replace(ulRegex, `$1\n${blogLink}`);
    } else {
      // Create new Recent Blogs section before closing body tag
      const blogSection = `  <h2>Recent Blogs</h2>
  <ul>
${blogLink}
  </ul>
</body>`;
      updatedContent = currentContent.replace('</body>', blogSection);
    }

    // Update the themed page
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: themedPagePath,
      message: `feat: add blog link for "${title}" to ${theme} page`,
      content: Buffer.from(updatedContent).toString('base64'),
      sha: fileData.sha
    });

  } catch (error) {
    console.error(`Error updating themed page ${theme}:`, error);
    // Don't throw error here as the blog was already created successfully
  }
}