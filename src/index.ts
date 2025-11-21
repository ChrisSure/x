import { start } from './modules/collector';

async function main(): Promise<void> {
  await start();
}

main().catch((error: Error) => {
  console.error('Application error:', error);
  process.exit(1);
});
