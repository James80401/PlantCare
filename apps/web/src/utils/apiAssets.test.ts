import { describe, expect, it } from 'vitest';
import { resolveApiAssetUrl, resolveApiThumbnailUrl } from './apiAssets';

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

describe('resolveApiThumbnailUrl', () => {
  it('routes API uploads through the thumbnail endpoint', () => {
    expect(
      resolveApiThumbnailUrl(
        'http://localhost:3001/uploads/plant.jpg',
        160,
        'https://api.drplant.app/api/v1',
      ),
    ).toBe(
      'https://api.drplant.app/api/v1/media/thumbnail?src=%2Fuploads%2Fplant.jpg&size=160',
    );
  });

  it('routes bundled species photos through the thumbnail endpoint', () => {
    expect(
      resolveApiThumbnailUrl(
        '/care-guides/photos/species/plant.jpg',
        320,
        'https://api.drplant.app/api/v1',
      ),
    ).toBe(
      'https://api.drplant.app/api/v1/media/thumbnail?src=%2Fcare-guides%2Fphotos%2Fspecies%2Fplant.jpg&size=320',
    );
  });

  it('leaves third-party images unchanged', () => {
    expect(
      resolveApiThumbnailUrl(
        'https://images.example.com/plant.jpg',
        160,
        'https://api.drplant.app/api/v1',
      ),
    ).toBe('https://images.example.com/plant.jpg');
  });
});
