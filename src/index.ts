import 'dotenv/config';
import { CollectorModule } from './modules/collector';
import { logger } from './core/services/logger/logger.service';

function main(): void {
  const collectorModule = new CollectorModule();
  collectorModule.start();
}

try {
  main();
} catch (error) {
  logger.error('Application error:', error);
  process.exit(1);
}
