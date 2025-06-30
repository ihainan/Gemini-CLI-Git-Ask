# Gemini CLI Git Ask Demo

This is a web demo for the Gemini CLI Git Ask tool that allows users to ask questions about GitHub repositories.

## Features

- Clean and modern web interface
- Support for Chinese character encoding and display
- Pre-filled example repositories and questions (randomly selected)
- Real-time API calls to the AI assistant
- Markdown rendering of AI responses
- Loading states and error handling
- Responsive design

## Quick Start

1. Start the demo using Docker Compose:
   ```bash
   cd docker
   docker-compose -f docker-compose-dev.yaml up -d
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:18081
   ```

3. The page will automatically load with a random GitHub repository URL and question. You can:
   - Use the pre-filled examples
   - Enter your own GitHub repository URL
   - Ask your own questions
   - Click "Ask AI Assistant" to get responses

## API Integration

The demo calls the `/api/ask` endpoint which is proxied to `http://192.168.100.101:18080/api/v1/ask`.

Expected API request format:
```json
{
  "repository_url": "https://github.com/owner/repo",
  "question": "Your question about the repository"
}
```

Expected API response format:
```json
{
  "answer": "AI assistant's response in markdown format"
}
```

## Architecture

- **Frontend**: Pure HTML/CSS/JavaScript with Marked.js for Markdown rendering
- **Backend Proxy**: Nginx serving static files and proxying API requests
- **Deployment**: Docker Compose with nginx:alpine image

## Files Structure

```
docker/
├── demo/
│   ├── index.html      # Main web interface
│   ├── nginx.conf      # Nginx configuration
│   └── README.md       # This file
└── docker-compose-dev.yaml  # Docker Compose configuration
```

## Stopping the Demo

To stop the demo:
```bash
cd docker
docker-compose -f docker-compose-dev.yaml down
``` 