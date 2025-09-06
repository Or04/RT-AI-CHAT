// server.js - AI Chat Backend Server
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory job storage (in production, use Redis/Database)
const jobs = new Map();
const jobResults = new Map();

// Job statuses
const JobStatus = {
    CREATED: 'created',
    PROCESSING: 'processing',
    ANALYZING: 'analyzing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// AI Response Templates (simulate AI processing)
const AI_RESPONSES = [
    {
        keywords: ['architecture', 'system', 'design'],
        response: "Great question about system architecture! This chat system uses a microservices approach with async job processing. The frontend communicates via REST APIs, jobs are queued for processing, and results are polled. This ensures scalability and reliability."
    },
    {
        keywords: ['scalability', 'scale', 'performance'],
        response: "For scalability, we implement horizontal scaling with load balancers, database sharding, and message queues. The job processing system can handle thousands of concurrent requests through worker pools and async processing."
    },
    {
        keywords: ['reliability', 'fault', 'error'],
        response: "Reliability is ensured through retry mechanisms, dead letter queues, circuit breakers, and idempotent operations. We implement health checks, graceful degradation, and comprehensive monitoring."
    },
    {
        keywords: ['security', 'auth', 'privacy'],
        response: "Security measures include JWT authentication, rate limiting, input validation, HTTPS encryption, and data anonymization. We follow OWASP guidelines and implement zero-trust architecture."
    },
    {
        keywords: ['cost', 'optimization', 'budget'],
        response: "Cost optimization strategies include auto-scaling based on demand, caching frequently accessed data, optimizing database queries, and using serverless functions for variable workloads."
    },
    {
        default: "That's an interesting question! I'm designed to help with various technical discussions. Could you provide more context about what specific aspect you'd like me to focus on?"
    }
];

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Create a new job
app.post('/api/jobs', async (req, res) => {
    try {
        const { message, type = 'chat' } = req.body;
        
        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid message',
                message: 'Message is required and must be a non-empty string'
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                error: 'Message too long',
                message: 'Message must be less than 1000 characters'
            });
        }

        const jobId = uuidv4();
        const job = {
            id: jobId,
            message: message.trim(),
            type,
            status: JobStatus.CREATED,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        jobs.set(jobId, job);

        // Start processing the job asynchronously
        processJobAsync(jobId);

        // Log job creation
        console.log(`[JOB CREATED] ${jobId} - "${message.substring(0, 50)}..."`);

        res.status(201).json({
            jobId,
            status: JobStatus.CREATED,
            message: 'Job created successfully'
        });

    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create job'
        });
    }
});

// Get job status
app.get('/api/jobs/:jobId', (req, res) => {
    try {
        const { jobId } = req.params;

        if (!jobs.has(jobId)) {
            return res.status(404).json({
                error: 'Job not found',
                message: `Job with ID ${jobId} does not exist`
            });
        }

        const job = jobs.get(jobId);
        const result = jobResults.get(jobId);

        const response = {
            jobId: job.id,
            status: job.status,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
        };

        if (result) {
            response.result = result;
        }

        res.json(response);

    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch job status'
        });
    }
});

// Get all jobs (for debugging)
app.get('/api/jobs', (req, res) => {
    try {
        const allJobs = Array.from(jobs.values()).map(job => ({
            id: job.id,
            status: job.status,
            createdAt: job.createdAt,
            message: job.message.substring(0, 100) + (job.message.length > 100 ? '...' : '')
        }));

        res.json({
            jobs: allJobs,
            total: allJobs.length
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch jobs'
        });
    }
});

// Async job processing function
async function processJobAsync(jobId) {
    const job = jobs.get(jobId);
    if (!job) return;

    try {
        // Update status to processing
        job.status = JobStatus.PROCESSING;
        job.updatedAt = new Date().toISOString();
        jobs.set(jobId, job);

        // Simulate initial processing delay
        await delay(1000 + Math.random() * 1000);

        // Update status to analyzing
        job.status = JobStatus.ANALYZING;
        job.updatedAt = new Date().toISOString();
        jobs.set(jobId, job);

        // Simulate AI processing delay
        await delay(2000 + Math.random() * 2000);

        // Generate AI response
        const aiResponse = generateAIResponse(job.message);

        // Store result
        jobResults.set(jobId, aiResponse);

        // Update status to completed
        job.status = JobStatus.COMPLETED;
        job.updatedAt = new Date().toISOString();
        jobs.set(jobId, job);

        console.log(`[JOB COMPLETED] ${jobId}`);

    } catch (error) {
        console.error(`[JOB FAILED] ${jobId}:`, error);
        
        job.status = JobStatus.FAILED;
        job.updatedAt = new Date().toISOString();
        jobs.set(jobId, job);
        
        jobResults.set(jobId, 'Sorry, I encountered an error processing your request. Please try again.');
    }
}

// AI response generator
function generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Find matching response template
    for (const template of AI_RESPONSES) {
        if (template.keywords) {
            const hasKeyword = template.keywords.some(keyword => 
                lowerMessage.includes(keyword.toLowerCase())
            );
            if (hasKeyword) {
                return template.response;
            }
        }
    }
    
    // Return default response
    return AI_RESPONSES.find(template => template.default).default;
}

// Utility function for delays
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Cleanup old jobs (run every 5 minutes)
setInterval(() => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [jobId, job] of jobs.entries()) {
        const jobAge = now - new Date(job.createdAt).getTime();
        if (jobAge > maxAge) {
            jobs.delete(jobId);
            jobResults.delete(jobId);
            console.log(`[CLEANUP] Removed old job ${jobId}`);
        }
    }
}, 5 * 60 * 1000);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Chat Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 API endpoints:`);
    console.log(`   POST /api/jobs - Create new job`);
    console.log(`   GET  /api/jobs/:id - Get job status`);
    console.log(`   GET  /api/jobs - List all jobs`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
    process.exit(0);
});

module.exports = app;