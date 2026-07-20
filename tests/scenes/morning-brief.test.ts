import { describe, it, expect } from 'vitest';
import { handleMorningBrief } from '../../src/scenes/morning-brief.js';

describe('Scene: 智能早报', () => {
  it('returns morning brief with greeting', async () => {
    const r = await handleMorningBrief();
    expect(r.text).toMatch(/好|早安/);
  });

  it('includes weather section', async () => {
    const r = await handleMorningBrief();
    expect(r.text).toContain('天气');
  });

  it('includes date info', async () => {
    const r = await handleMorningBrief();
    expect(r.text).toMatch(/\d+月\d+日/);
  });

  it('returns actionable suggestions', async () => {
    const r = await handleMorningBrief();
    expect(r.suggestions.length).toBeGreaterThan(0);
  });
});
