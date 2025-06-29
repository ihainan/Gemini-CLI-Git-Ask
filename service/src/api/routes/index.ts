/**
 * API Routes Configuration
 */

import { Router } from 'express';
import { validateAskRequest } from '../middleware/validation';
import { handleAskRequest, handleStatsRequest, handleGeminiHealthCheck } from './ask';

export function createApiRoutes(): Router {
  const router = Router();

  // Main ask endpoint
  router.post('/v1/ask', validateAskRequest, handleAskRequest);

  // Statistics endpoint
  router.get('/v1/stats', handleStatsRequest);

  // Gemini CLI health check
  router.get('/v1/gemini/health', handleGeminiHealthCheck);

  return router;
} 