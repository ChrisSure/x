/**
 * Main entry point for the application
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function add(a: number, b: number): number {
  return a + b;
}

// Run if executed directly
if (require.main === module) {
  // eslint-disable-next-line no-console
  console.log(greet('World'));
  // eslint-disable-next-line no-console
  console.log(`2 + 3 = ${add(2, 3)}`);
}
