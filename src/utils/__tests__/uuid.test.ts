import { describe, expect, it } from 'vitest';
import { randomUuid } from '../uuid';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('randomUuid', () => {
  it('returns v4-shaped ids', () => {
    expect(randomUuid()).toMatch(UUID_RE);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, randomUuid));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(UUID_RE);
  });
});
