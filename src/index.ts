import 'dotenv/config';
import { CollectorModule } from './modules/collector';
import { logger } from './core/services/logger/logger.service';

async function main(): Promise<void> {
  const collectorModule = new CollectorModule();
  await collectorModule.start();
}

main().catch((error: Error) => {
  logger.error('Application error:', error);
  process.exit(1);
});
