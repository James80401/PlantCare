import axios from 'axios';
import { PlantNetService } from './plantnet.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeFile(): Express.Multer.File {
  return {
    buffer: Buffer.from([0xff, 0xd8, 0xff]),
    mimetype: 'image/jpeg',
    originalname: 'photo.jpg',
    fieldname: 'image',
    encoding: '7bit',
    size: 3,
    stream: undefined as never,
    destination: '',
    filename: 'photo.jpg',
    path: '',
  };
}

function makeService(env: Record<string, string | undefined> = {}) {
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      const merged: Record<string, string | undefined> = { PLANTNET_API_KEY: 'test-key', ...env };
      return merged[key] ?? fallback;
    }),
  };
  return new PlantNetService(config as never);
}

describe('PlantNetService confidence threshold', () => {
  beforeEach(() => mockedAxios.post.mockReset());

  it('returns a result when PlantNet confidence is comfortably above 0.10', async () => {
    const svc = makeService();
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        results: [
          {
            score: 0.42,
            species: { commonNames: ['Monstera'], scientificNameWithoutAuthor: 'Monstera deliciosa' },
          },
        ],
      },
    } as never);

    const result = await svc.identify(makeFile());
    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(0.42);
    expect(result!.scientificName).toBe('Monstera deliciosa');
    expect(result!.provider).toBe('plantnet');
  });

  it('rejects (returns null) when PlantNet returns a score below the default threshold', async () => {
    const svc = makeService();
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        results: [
          {
            score: 0.04,
            species: { commonNames: ['Whatever'], scientificNameWithoutAuthor: 'Whatever sp.' },
          },
        ],
      },
    } as never);

    const result = await svc.identify(makeFile());
    expect(result).toBeNull();
  });

  it('honors a configured PLANTNET_MIN_CONFIDENCE override', async () => {
    const svc = makeService({ PLANTNET_MIN_CONFIDENCE: '0.5' });
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        results: [
          {
            score: 0.3,
            species: { commonNames: ['Borderline'], scientificNameWithoutAuthor: 'Borderline sp.' },
          },
        ],
      },
    } as never);

    const result = await svc.identify(makeFile());
    expect(result).toBeNull();
  });

  it('falls back to demo mode when no API key is configured', async () => {
    const svc = makeService({ PLANTNET_API_KEY: undefined });
    const result = await svc.identify(makeFile());
    expect(result?.commonName).toBe('Unknown (demo)');
    expect(result?.provider).toBe('demo');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
