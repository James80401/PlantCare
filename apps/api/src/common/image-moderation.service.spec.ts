import { BadRequestException } from '@nestjs/common';
import { ImageModerationService } from './image-moderation.service';
import axios from 'axios';

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

function makeService(envOverrides: Record<string, string | undefined> = {}): ImageModerationService {
  const config = {
    get: jest.fn((key: string, fallback?: string) => {
      const env: Record<string, string | undefined> = {
        OPENAI_API_KEY: 'sk-test',
        OPENAI_MODERATION_MODEL: 'gpt-4o-mini',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        ...envOverrides,
      };
      return env[key] ?? fallback;
    }),
  };
  return new ImageModerationService(config as never);
}

function mockOpenAiReply(content: unknown) {
  mockedAxios.post.mockResolvedValueOnce({
    data: { choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }] },
  } as never);
}

describe('ImageModerationService', () => {
  beforeEach(() => {
    mockedAxios.post.mockReset();
  });

  it('returns the verdict for a plant image', async () => {
    const svc = makeService();
    mockOpenAiReply({ isPlant: true, isExplicit: false, confidence: 0.95, reason: 'clear leaf' });

    const verdict = await svc.assertImageAllowed(makeFile());

    expect(verdict?.isPlant).toBe(true);
    expect(verdict?.isExplicit).toBe(false);
  });

  it('throws BadRequest when the image is not a plant', async () => {
    const svc = makeService();
    mockOpenAiReply({ isPlant: false, isExplicit: false, confidence: 0.92, reason: 'photo of a dog' });

    await expect(svc.assertImageAllowed(makeFile())).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequest when the image is explicit, regardless of isPlant', async () => {
    const svc = makeService();
    mockOpenAiReply({ isPlant: true, isExplicit: true, confidence: 0.99, reason: 'nsfw content' });

    await expect(svc.assertImageAllowed(makeFile())).rejects.toBeInstanceOf(BadRequestException);
  });

  it('skips moderation entirely when no API key is configured', async () => {
    const svc = makeService({ OPENAI_API_KEY: undefined });

    const verdict = await svc.assertImageAllowed(makeFile());

    expect(verdict).toBeNull();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('fails open when OpenAI itself errors out (does not lock out users)', async () => {
    const svc = makeService();
    mockedAxios.post.mockRejectedValueOnce(new Error('connection refused'));

    const verdict = await svc.assertImageAllowed(makeFile());

    expect(verdict?.isPlant).toBe(true);
    expect(verdict?.isExplicit).toBe(false);
  });

  it('fails open on unparseable response', async () => {
    const svc = makeService();
    mockOpenAiReply('not json at all');

    const verdict = await svc.assertImageAllowed(makeFile());

    expect(verdict?.isPlant).toBe(true);
    expect(verdict?.isExplicit).toBe(false);
  });

  it('uses the configured base URL and model', async () => {
    const svc = makeService({ OPENAI_BASE_URL: 'https://custom.example.com/v1/', OPENAI_MODERATION_MODEL: 'gpt-custom' });
    mockOpenAiReply({ isPlant: true, isExplicit: false, confidence: 0.8, reason: '' });

    await svc.assertImageAllowed(makeFile());

    const [url, body] = mockedAxios.post.mock.calls[0] as [string, { model: string }];
    expect(url).toBe('https://custom.example.com/v1/chat/completions');
    expect(body.model).toBe('gpt-custom');
  });
});
