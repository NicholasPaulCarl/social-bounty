// ─────────────────────────────────────
// Health Check DTOs
// ─────────────────────────────────────

// GET /health
export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  version: string;
  services: {
    database: 'ok' | 'error';
    fileStorage: 'ok' | 'error';
  };
}
