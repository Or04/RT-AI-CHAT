// server.test.js - Basic tests for AI Chat System
const request = require('supertest');
const app = require('./server');

describe('AI Chat System API Tests', () => {
  
  describe('Health Check', () => {
    test('GET /health should return healthy status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Job Creation', () => {
    test('POST /api/jobs should create a new job with valid message', async () => {
      const message = 'Test message for job creation';
      
      const response = await request(app)
        .post('/api/jobs')
        .send({ message, type: 'chat' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('status', 'created');
      expect(response.body).toHaveProperty('message', 'Job created successfully');
      expect(typeof response.body.jobId).toBe('string');
    });

    test('POST /api/jobs should reject empty message', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({ message: '', type: 'chat' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid message');
    });

    test('POST /api/jobs should reject missing message', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({ type: 'chat' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid message');
    });

    test('POST /api/jobs should reject message that is too long', async () => {
      const longMessage = 'a'.repeat(1001);
      
      const response = await request(app)
        .post('/api/jobs')
        .send({ message: longMessage, type: 'chat' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Message too long');
    });
  });

  describe('Job Status Retrieval', () => {
    let jobId;

    beforeEach(async () => {
      // Create a job for testing
      const response = await request(app)
        .post('/api/jobs')
        .send({ message: 'Test message for status check', type: 'chat' });
      
      jobId = response.body.jobId;
    });

    test('GET /api/jobs/:jobId should return job status', async () => {
      const response = await request(app).get(`/api/jobs/${jobId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobId', jobId);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(['created', 'processing', 'analyzing', 'completed', 'failed'])
        .toContain(response.body.status);
    });

    test('GET /api/jobs/:jobId should return 404 for non-existent job', async () => {
      const fakeJobId = 'non-existent-job-id';
      const response = await request(app).get(`/api/jobs/${fakeJobId}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Job not found');
    });

    test('Job should eventually complete with AI response', async (done) => {
      // Poll for job completion
      const checkStatus = async (attempts = 0) => {
        if (attempts > 20) { // Max 20 seconds
          done(new Error('Job did not complete in time'));
          return;
        }

        const response = await request(app).get(`/api/jobs/${jobId}`);
        
        if (response.body.status === 'completed') {
          expect(response.body).toHaveProperty('result');
          expect(typeof response.body.result).toBe('string');
          expect(response.body.result.length).toBeGreaterThan(0);
          done();
        } else if (response.body.status === 'failed') {
          done(new Error('Job failed to process'));
        } else {
          setTimeout(() => checkStatus(attempts + 1), 1000);
        }
      };

      checkStatus();
    }, 25000); // 25 second timeout
  });

  describe('Job Listing', () => {
    test('GET /api/jobs should return list of all jobs', async () => {
      // Create a couple of jobs
      await request(app)
        .post('/api/jobs')
        .send({ message: 'First test job', type: 'chat' });
      
      await request(app)
        .post('/api/jobs')
        .send({ message: 'Second test job', type: 'chat' });

      const response = await request(app).get('/api/jobs');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jobs');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.jobs)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    test('Unknown endpoints should return 404', async () => {
      const response = await request(app).get('/unknown-endpoint');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not found');
    });

    test('Invalid JSON should be handled gracefully', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');
      
      expect(response.status).toBe(400);
    });
  });

  describe('AI Response Generation', () => {
    const testCases = [
      {
        message: 'How does your architecture work?',
        expectedKeywords: ['architecture', 'system', 'microservices']
      },
      {
        message: 'Tell me about scalability',
        expectedKeywords: ['scalability', 'scaling', 'horizontal']
      },
      {
        message: 'What about security and privacy?',
        expectedKeywords: ['security', 'JWT', 'encryption']
      }
    ];

    testCases.forEach(({ message, expectedKeywords }) => {
      test(`Should generate contextual response for: "${message}"`, async (done) => {
        const createResponse = await request(app)
          .post('/api/jobs')
          .send({ message, type: 'chat' });
        
        const jobId = createResponse.body.jobId;

        // Poll until completion
        const checkCompletion = async (attempts = 0) => {
          if (attempts > 15) {
            done(new Error('Job completion timeout'));
            return;
          }

          const statusResponse = await request(app).get(`/api/jobs/${jobId}`);
          
          if (statusResponse.body.status === 'completed') {
            const result = statusResponse.body.result.toLowerCase();
            const hasKeyword = expectedKeywords.some(keyword => 
              result.includes(keyword.toLowerCase())
            );
            
            expect(hasKeyword).toBe(true);
            expect(result.length).toBeGreaterThan(50); // Substantial response
            done();
          } else {
            setTimeout(() => checkCompletion(attempts + 1), 1000);
          }
        };

        checkCompletion();
      }, 20000);
    });
  });

  describe('Performance Tests', () => {
    test('Should handle multiple concurrent job creations', async () => {
      const concurrentJobs = 10;
      const promises = [];

      for (let i = 0; i < concurrentJobs; i++) {
        promises.push(
          request(app)
            .post('/api/jobs')
            .send({ message: `Concurrent test message ${i}`, type: 'chat' })
        );
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('jobId');
      });

      // Verify all jobs have unique IDs
      const jobIds = responses.map(r => r.body.jobId);
      const uniqueIds = new Set(jobIds);
      expect(uniqueIds.size).toBe(concurrentJobs);
    });

    test('API response times should be reasonable', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/jobs')
        .send({ message: 'Performance test message', type: 'chat' });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(500); // Should be under 500ms
    });
  });
});

// Helper function to wait for job completion
async function waitForJobCompletion(app, jobId, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await request(app).get(`/api/jobs/${jobId}`);
    
    if (response.body.status === 'completed') {
      return response.body;
    } else if (response.body.status === 'failed') {
      throw new Error('Job failed to process');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Job did not complete within timeout');
}