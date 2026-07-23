import assert from 'node:assert/strict';
import test from 'node:test';
import { collectReferences, managedFileName } from './audit-orphan-media.mjs';

test('managedFileName accepts only a single managed upload path segment', () => {
  assert.equal(managedFileName('/uploads/photo.webp'), 'photo.webp');
  assert.equal(
    managedFileName('https://api.drplant.app/uploads/photo.webp?version=1'),
    'photo.webp',
  );
  assert.equal(managedFileName('/public/photo.webp'), null);
  assert.equal(managedFileName('/uploads/nested/photo.webp'), null);
  assert.equal(managedFileName('/uploads/%2e%2e%2fsecret'), null);
});

test('collectReferences deduplicates managed media and ignores external files', () => {
  assert.deepEqual(
    [
      ...collectReferences([
        ['/uploads/one.webp', '/uploads/one.webp'],
        ['https://cdn.example.com/external.jpg', '/uploads/two.webp'],
        [null, undefined],
      ]),
    ].sort(),
    ['one.webp', 'two.webp'],
  );
});
