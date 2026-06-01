/**
 * API base URLs – match docker-compose port mappings.
 * When running locally without Docker, these point to localhost.
 */
export const API = {
  AUTH:          'http://localhost:3001',
  USERS:         'http://localhost:3002',
  NOTES:         'http://localhost:3003',
  NOTIFICATIONS: 'http://localhost:3004',
};
