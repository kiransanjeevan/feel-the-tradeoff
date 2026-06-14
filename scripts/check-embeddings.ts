// One-off verification (NOT a CI test — it downloads the model). Run with:
//   npx vite-node scripts/check-embeddings.ts
// Proves scoreDocuments() produces real semantic similarity: relevant docs
// should out-score irrelevant ones for the query.
import { scoreDocuments } from '../src/embeddings';

const query = 'How do I reset my password?';
const docs = [
  { text: "Click 'Forgot password' on the sign-in page to reset it.", relevant: true },
  { text: 'Reset links expire after 30 minutes for security.', relevant: true },
  { text: 'You can update your billing address under Account settings.', relevant: false },
  { text: 'The weather today is sunny with a high of 24 degrees.', relevant: false },
];

const scored = await scoreDocuments(query, docs, (p) => {
  process.stdout.write(`\r${p.status}${typeof p.progress === 'number' ? ` ${Math.round(p.progress)}%` : ''}        `);
});

console.log('\n\nquery:', query, '\n');
scored
  .map((s, i) => ({ ...s, text: docs[i].text }))
  .sort((a, b) => b.score - a.score)
  .forEach((s) => console.log(`${s.score.toFixed(3)}  ${s.relevant ? 'REL ' : 'irr '} ${s.text}`));

const relMin = Math.min(...scored.filter((s) => s.relevant).map((s) => s.score));
const irrMax = Math.max(...scored.filter((s) => !s.relevant).map((s) => s.score));
console.log(`\nlowest relevant ${relMin.toFixed(3)} vs highest irrelevant ${irrMax.toFixed(3)} → ${relMin > irrMax ? 'PASS ✓ (clean separation)' : 'overlap (expected for some inputs)'}`);
