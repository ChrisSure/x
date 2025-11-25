import 'dotenv/config';
import { start } from './modules/collector';
import { logger } from './core/services/logger.service';

async function main(): Promise<void> {
  await start();
}

main().catch((error: Error) => {
  logger.error('Application error:', error);
  process.exit(1);
});
