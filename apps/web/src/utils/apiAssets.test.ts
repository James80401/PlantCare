import { describe, expect, it } from 'vitest';
import { resolveApiAssetUrl } from './apiAssets';

describe('resolveApiAssetUrl', () => {
  it('keeps browser-local previews unchanged', () => {
    expect(resolveApiAssetUrl('blob:https://app.example.com/photo')).toBe(
      'blob:https://app.example.com/photo',
    );
  });

  it('keeps public absolute image URLs unchanged', () => {
    expect(resolveApiAssetUrl('https://cdn.example.com/plant.jpg')).toBe(
      'https://cdn.example.com/plant.jpg',
    );
  });

  it('keeps relative assets portable when the API base is relative', () => {
    expect(resolveApiAssetUrl('/uploads/plant.jpg')).toBe('/uploads/plant.jpg');
  });

  it('points API-relative uploads at the configured API host', () => {
    expect(
      resolveApiAssetUrl('/uploads/plant.jpg', 'https://api.drplant.app/api/v1'),
    ).toBe('https://api.drplant.app/uploads/plant.jpg');
  });

  it('repairs legacy localhost upload URLs for remote clients', () => {
    expect(
      resolveApiAssetUrl(
        'http://localhost:3001/uploads/plant.jpg',
        'https://api.drplant.app/api/v1',
      ),
    ).toBe('https://api.drplant.app/uploads/plant.jpg');
  });
});
