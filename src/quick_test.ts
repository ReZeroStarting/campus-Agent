import { processMessage } from './agent.js';

const tests = ['高数什么时候考', '教三找个空教室'];
for (const t of tests) {
  const r = await processMessage(t);
  console.log(`\nQ: ${t}`);
  console.log(`A: ${r.text.split('\n')[0]}...`);
}
