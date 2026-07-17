// Quick map test
import { processMessage } from './agent.js';
import { setCurrentLocation } from './scenes/map.js';

const tests = [
  '校园地图',
  '我在教三',
  '图书馆在哪',
  '去哪打成绩单',
  '到图书馆怎么走',
];

for (const t of tests) {
  const r = await processMessage(t);
  console.log(`\nQ: ${t}`);
  console.log(`A: ${r.text.split('\n')[0]}...`);
}
