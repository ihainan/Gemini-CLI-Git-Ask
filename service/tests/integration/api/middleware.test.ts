/**
 * Integration tests for API middleware
 */

// Import setup first to ensure mocks are applied
import '../../setup-integration';

import express from 'express';
import request from 'supertest';
import { createTestApp } from '../../helpers/test-app';
import { ApiErrorCode } from '../../../src/types';

describe('API Middleware', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('Error Handler Middleware', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error_code', 'NOT_FOUND');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle 404 for non-existent API routes', async () => {
      const response = await request(app)
        .post('/api/v1/invalid')
        .send({})
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error_code', 'NOT_FOUND');
    });

    it('should handle method not allowed', async () => {
      const response = await request(app)
        .get('/api/v1/ask')  // GET instead of POST
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/ask')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('Validation Middleware', () => {
    describe('Request body validation', () => {
      it('should reject empty request body', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      });

      it('should reject request with only repository_url', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({ repository_url: 'https://github.com/test/repo' })
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
        expect(response.body).toHaveProperty('details');
        expect(response.body.details).toHaveProperty('validation_errors');
        expect(response.body.details.validation_errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'question',
              message: expect.stringContaining('question is required')
            })
          ])
        );
      });

      it('should reject request with only question', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({ question: 'What does this code do?' })
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
        expect(response.body).toHaveProperty('details');
        expect(response.body.details).toHaveProperty('validation_errors');
        expect(response.body.details.validation_errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'repository_url',
              message: expect.stringContaining('repository_url is required')
            })
          ])
        );
      });
    });

    describe('Field type validation', () => {
      it('should reject non-string repository_url', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 123,
            question: 'What does this code do?'
          })
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      });

      it('should reject non-string question', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 'https://github.com/test/repo',
            question: 123
          })
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      });

      it('should reject non-string branch', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 'https://github.com/test/repo',
            question: 'What does this code do?',
            branch: 123
          })
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      });

      it('should reject non-number timeout', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 'https://github.com/test/repo',
            question: 'What does this code do?',
            timeout: 'invalid'
          })
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      });
    });

    describe('URL validation', () => {
      it('should reject invalid URL protocols', async () => {
        const invalidUrls = [
          'ftp://example.com/repo',
          'file:///local/path',
          'javascript:alert(1)',
          'data:text/html,<script>alert(1)</script>'
        ];

        for (const url of invalidUrls) {
          const response = await request(app)
            .post('/api/v1/ask')
            .send({
              repository_url: url,
              question: 'What does this code do?'
            })
            .expect(400);

          expect(response.body).toHaveProperty('status', 'error');
          expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
        }
      });

      it('should reject malformed URLs', async () => {
        const malformedUrls = [
          'not-a-url',
          'http://',
          'https://',
          'github.com/repo',
          'http://github com/repo',
          'https://github.com/repo with spaces'
        ];

        for (const url of malformedUrls) {
          const response = await request(app)
            .post('/api/v1/ask')
            .send({
              repository_url: url,
              question: 'What does this code do?'
            })
            .expect(400);

          expect(response.body).toHaveProperty('status', 'error');
          expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
        }
      });

      it('should accept valid GitHub URLs', async () => {
        const validUrls = [
          'https://github.com/owner/repo',
          'https://github.com/owner/repo.git',
          'https://github.com/owner/repo/',
          'git@github.com:owner/repo.git'
        ];

        // Note: These will fail at service level but should pass validation
        for (const url of validUrls) {
          const response = await request(app)
            .post('/api/v1/ask')
            .send({
              repository_url: url,
              question: 'What does this code do?'
            });

          // Should not be a validation error (400)
          expect(response.status).not.toBe(400);
        }
      });
    });

    describe('Value range validation', () => {
      it('should reject negative timeout', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 'https://github.com/test/repo',
            question: 'What does this code do?',
            timeout: -1
          })
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      });

      it('should reject zero timeout', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 'https://github.com/test/repo',
            question: 'What does this code do?',
            timeout: 0
          })
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      });

      it('should reject extremely large timeout', async () => {
        const response = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 'https://github.com/test/repo',
            question: 'What does this code do?',
            timeout: 999999999
          })
          .expect(400);

        expect(response.body).toHaveProperty('status', 'error');
        expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      });

      it('should accept reasonable timeout values', async () => {
        const validTimeouts = [30, 60, 300, 600, 1800, 3600];

        for (const timeout of validTimeouts) {
          const response = await request(app)
            .post('/api/v1/ask')
            .send({
              repository_url: 'https://github.com/test/repo',
              question: 'What does this code do?',
              timeout: timeout
            });

          // Should not be a validation error (400)
          expect(response.status).not.toBe(400);
        }
      });
    });

    describe('String length validation', () => {
      it('should reject empty strings', async () => {
        const response1 = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: '',
            question: 'What does this code do?'
          })
          .expect(400);

        expect(response1.body).toHaveProperty('status', 'error');
        expect(response1.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);

        const response2 = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 'https://github.com/test/repo',
            question: ''
          })
          .expect(400);

        expect(response2.body).toHaveProperty('status', 'error');
        expect(response2.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      });

      it('should reject whitespace-only strings', async () => {
        const response1 = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: '   ',
            question: 'What does this code do?'
          })
          .expect(400);

        expect(response1.body).toHaveProperty('status', 'error');

        const response2 = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 'https://github.com/test/repo',
            question: '   '
          })
          .expect(400);

        expect(response2.body).toHaveProperty('status', 'error');
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for Helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/v1/ask')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Content Type Handling', () => {
    it('should reject non-JSON content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/v1/ask')
        .set('Content-Type', 'text/plain')
        .send('not json')
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should handle missing content type', async () => {
      const response = await request(app)
        .post('/api/v1/ask')
        .send({
          repository_url: 'https://github.com/test/repo',
          question: 'What does this code do?'
        });

      // Should not fail due to content type (Express handles this)
      expect(response.status).not.toBe(415);
    });
  });
}); 