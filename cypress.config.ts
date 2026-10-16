import { defineConfig } from 'cypress';
import { execSync } from 'node:child_process';

export default defineConfig({
  expose: {
    LIVE_E2E: process.env.CYPRESS_LIVE_E2E,
    API_BASE_URL: process.env.CYPRESS_API_BASE_URL,
    BACKEND_DIGEST: process.env.CYPRESS_BACKEND_DIGEST,
    E2E_CARD_QUERY: process.env.CYPRESS_E2E_CARD_QUERY,
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    setupNodeEvents(on, config) {
      on('task', {
        cleanupLocalDbOrder(orderId: string | number) {
          try {
            // Delete order items and order from local PostgreSQL container if running
            const sql = `DELETE FROM order_items WHERE order_id = ${orderId}; DELETE FROM orders WHERE id = ${orderId};`;
            execSync(`docker exec tcg_postgres psql -U postgres -d tcg_store -c "${sql}"`, {
              stdio: 'pipe',
            });
            return { success: true, message: `Order ${orderId} cleaned up from local database.` };
          } catch {
            return { success: false, message: 'Local Postgres container not available or order not found' };
          }
        },
      });
    },
  },
});
