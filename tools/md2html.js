import { marked } from 'marked';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert line breaks to <br>
  headerIds: true, // Add IDs to headers
  mangle: false, // Don't escape HTML
  pedantic: false, // Don't be too strict
  sanitize: false, // Allow HTML
  smartLists: true, // Use smarter list behavior
  smartypants: true, // Use smart punctuation
  xhtml: true // Use XHTML-style tags
});

// HTML template
const htmlTemplate = (title, content, style) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${style}
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;

// Default CSS styles
const defaultStyles = `
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }
    .container {
        background: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h1, h2, h3, h4, h5, h6 {
        color: #2c3e50;
        margin-top: 24px;
        margin-bottom: 16px;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: .3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: .3em; }
    h3 { font-size: 1.25em; }
    p { margin-bottom: 16px; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    pre {
        background-color: #f6f8fa;
        border-radius: 3px;
        padding: 16px;
        overflow: auto;
    }
    code {
        font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
        background-color: rgba(27,31,35,0.05);
        border-radius: 3px;
        padding: 0.2em 0.4em;
        font-size: 85%;
    }
    pre code {
        background-color: transparent;
        padding: 0;
    }
    blockquote {
        margin: 0;
        padding: 0 1em;
        color: #6a737d;
        border-left: 0.25em solid #dfe2e5;
    }
    table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 16px;
    }
    th, td {
        padding: 6px 13px;
        border: 1px solid #dfe2e5;
    }
    tr:nth-child(2n) {
        background-color: #f6f8fa;
    }
    img {
        max-width: 100%;
        height: auto;
    }
    ul, ol {
        padding-left: 2em;
    }
    li + li {
        margin-top: 0.25em;
    }
`;

async function convertMarkdownFile(inputPath, outputPath = null) {
    try {
        // Read the markdown file
        const markdown = await fs.readFile(inputPath, 'utf-8');
        
        // Convert markdown to HTML
        const content = marked(markdown);
        
        // Get title from first heading or filename
        let title = content.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] || 
                   path.basename(inputPath, '.md');
        
        // Generate full HTML document
        const htmlContent = htmlTemplate(title, content, defaultStyles);
        
        // Determine output path if not provided
        if (!outputPath) {
            const dir = path.dirname(inputPath);
            const basename = path.basename(inputPath, '.md');
            outputPath = path.join(dir, `${basename}.html`);
        }
        
        // Write the HTML file
        await fs.writeFile(outputPath, htmlContent, 'utf-8');
        
        console.log(`Successfully converted ${inputPath} to ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        throw error;
    }
}

// Handle command line arguments
if (process.argv.length < 3) {
    console.error('Usage: node md2html.js <input-markdown-file> [output-html-file]');
    process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

convertMarkdownFile(inputFile, outputFile).catch(console.error);
