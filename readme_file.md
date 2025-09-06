# 🤖 AI Chat System

A modern, real-time AI chat application built with asynchronous job processing architecture. This system demonstrates scalable patterns for handling user interactions through a queue-based processing pipeline.

## 🎯 Features

- **Real-time Chat Interface**: Modern, responsive UI with smooth animations
- **Asynchronous Processing**: Jobs are queued and processed in the background
- **Status Tracking**: Real-time job status updates (created → processing → analyzing → completed)
- **AI Response Generation**: Context-aware responses based on message content
- **Error Handling**: Graceful error recovery with retry mechanisms
- **Mobile Responsive**: Optimized for all device sizes
- **Performance Monitoring**: Built-in health checks and metrics

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS) ↔ Backend APIs (Node.js) ↔ Job Processing Engine
                              ↓
                        In-Memory Storage
```

The system uses a job-based architecture where each user message creates a job that's processed asynchronously, ensuring the UI remains responsive even under load.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- Modern web browser

### Installation

1. **Clone and setup:**
```bash
git clone <your-repo-url>
cd ai-chat-system
npm install
```

2. **Start the server:**
```bash
npm start
```

3. **Open your browser:**
Navigate to `http://localhost:3001`

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## 📁 Project Structure

```
ai-chat-system/
├── server.js              # Main backend server
├── package.json           # Dependencies and scripts
├── public/
│   └── index.html         # Frontend application
├── docs/
│   └── design-doc.md      # Technical documentation
└── README.md             # This file
```

## 🔧 API Endpoints

### Create Job
```http
POST /api/jobs
Content-Type: application/json

{
  "message": "Your message here",
  "type": "chat"
}
```

### Get Job Status
```http
GET /api/jobs/{jobId}
```

### Health Check
```http
GET /health
```

## 💡 Usage Examples

### Basic Chat Interaction

1. Open the application in your browser
2. Type a message like "How does your system work?"
3. Watch the real-time status updates as your job is processed
4. Receive an AI-generated response

### API Usage

```javascript
// Create a job
const response = await fetch('/api/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello AI!' })
});

const { jobId } = await response.json();

// Poll for results
const checkStatus = async () => {
  const statusRes = await fetch(`/api/jobs/${jobId}`);
  const job = await statusRes.json();
  
  if (job.status === 'completed') {
    console.log('AI Response:', job.result);
  } else {
    setTimeout(checkStatus, 1000);
  }
};

checkStatus();
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## 📊 Performance

- **Job Creation**: < 100ms response time
- **Processing Time**: 2-5 seconds average
- **Concurrent Users**: 100+ supported
- **Memory Usage**: ~50MB base

## 🔒 Security Features

- Input validation and sanitization
- Request size limits (1KB message limit)
- Automatic cleanup of old jobs
- CORS protection
- Security headers via Helmet.js

## 🌐 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
export NODE_ENV=production
npm start
```

### Docker (Future)
```bash
docker build -t ai-chat-system .
docker run -p 3001:3001 ai-chat-system
```

## 🛠️ Configuration

Environment variables:
```bash
PORT=3001                 # Server port (default: 3001)
NODE_ENV=development      # Environment mode
LOG_LEVEL=info           # Logging level
```

## 📈 Monitoring

Built-in monitoring endpoints:
- `/health` - Health check with uptime
- `/api/jobs` - View all active jobs (debug)

Key metrics tracked:
- Job creation rate
- Processing times
- Error rates
- System resource usage

## 🗂️ Technical Details

### Job States
1. **created** - Job queued for processing
2. **processing** - Initial processing stage
3. **analyzing** - AI analysis in progress
4. **completed** - Job finished successfully
5. **failed** - Error occurred during processing

### AI Response Engine
The system includes a smart response engine that:
- Analyzes message content for keywords
- Selects appropriate response templates
- Generates contextually relevant replies
- Handles edge cases gracefully

## 🔮 Future Enhancements

### Phase 1 (Next Sprint)
- [ ] WebSocket integration for real-time updates
- [ ] User authentication system
- [ ] Message history persistence
- [ ] Enhanced AI response templates

### Phase 2 (Production Ready)
- [ ] Redis job queue for scalability
- [ ] Database integration (PostgreSQL)
- [ ] Load balancer configuration
- [ ] Comprehensive monitoring dashboard

### Phase 3 (Advanced Features)
- [ ] Multi-language support
- [ ] File upload capabilities
- [ ] Advanced AI integrations
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

