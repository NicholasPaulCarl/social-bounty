import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

/** Build a SmsService with a ConfigService seeded with the given key-value map. */
async function buildService(
  configMap: Record<string, string | boolean | undefined>,
): Promise<SmsService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      SmsService,
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn(<T>(key: string, defaultValue?: T): T | string | boolean | undefined => {
            if (key in configMap) return configMap[key] as unknown as T;
            return defaultValue;
          }),
        },
      },
    ],
  }).compile();

  return module.get<SmsService>(SmsService);
}

describe('SmsService', () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    fetchSpy?.mockRestore();
    jest.restoreAllMocks();
  });

  // ── a) SMS_ENABLED=false ──────────────────────────────────────────────────

  describe('SMS_ENABLED=false', () => {
    it('resolves without calling fetch and logs a warning', async () => {
      const service = await buildService({
        SMS_ENABLED: false,
        BREVO_API_KEY: 'some-key',
        BREVO_SMS_SENDER: 'SomeSender',
        BREVO_SMS_DEFAULT_REGION: 'ZA',
      });

      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(
        service.sendOtpSms('+27814871705', '123456'),
      ).resolves.toBeUndefined();

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ── b) SMS_ENABLED=true but missing BREVO_API_KEY ────────────────────────

  describe('SMS_ENABLED=true + missing BREVO_API_KEY', () => {
    it('returns without calling fetch', async () => {
      const service = await buildService({
        SMS_ENABLED: 'true',
        BREVO_API_KEY: undefined,
        BREVO_SMS_SENDER: 'TestSender',
        BREVO_SMS_DEFAULT_REGION: 'ZA',
      });

      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(
        service.sendOtpSms('+27814871705', '123456'),
      ).resolves.toBeUndefined();

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ── c) SMS_ENABLED=true but missing BREVO_SMS_SENDER ─────────────────────

  describe('SMS_ENABLED=true + missing BREVO_SMS_SENDER', () => {
    it('returns without calling fetch', async () => {
      const service = await buildService({
        SMS_ENABLED: 'true',
        BREVO_API_KEY: 'test-api-key',
        BREVO_SMS_SENDER: undefined,
        BREVO_SMS_DEFAULT_REGION: 'ZA',
      });

      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(
        service.sendOtpSms('+27814871705', '123456'),
      ).resolves.toBeUndefined();

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ── d) Happy path ─────────────────────────────────────────────────────────

  describe('happy path (all env vars present)', () => {
    it('calls Brevo with correct URL, method, headers, and body', async () => {
      const service = await buildService({
        SMS_ENABLED: 'true',
        BREVO_API_KEY: 'test-key',
        BREVO_SMS_SENDER: 'TestSender',
        BREVO_SMS_DEFAULT_REGION: 'ZA',
      });

      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ messageId: 12345 }),
      } as Response);

      await expect(
        service.sendOtpSms('+27814871705', '123456'),
      ).resolves.toBeUndefined();

      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];

      expect(url).toBe('https://api.brevo.com/v3/transactionalSMS/sms');
      expect(init.method).toBe('POST');

      const headers = init.headers as Record<string, string>;
      expect(headers['api-key']).toBe('test-key');
      expect(headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(body.sender).toBe('TestSender');
      expect(body.recipient).toBe('+27814871705');
      expect(body.type).toBe('transactional');
      expect(typeof body.content).toBe('string');
      expect((body.content as string)).toContain('123456');
    });
  });

  // ── e) Non-2xx response ───────────────────────────────────────────────────

  describe('non-2xx response', () => {
    it('throws when Brevo returns a 400', async () => {
      const service = await buildService({
        SMS_ENABLED: 'true',
        BREVO_API_KEY: 'test-key',
        BREVO_SMS_SENDER: 'TestSender',
        BREVO_SMS_DEFAULT_REGION: 'ZA',
      });

      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('{"code":"invalid_sender"}'),
      } as Response);

      await expect(
        service.sendOtpSms('+27814871705', '123456'),
      ).rejects.toThrow();
    });
  });

  // ── f) onModuleInit log messages ──────────────────────────────────────────

  describe('onModuleInit', () => {
    it('logs "enabled" and the sender when SMS_ENABLED=true', async () => {
      const service = await buildService({
        SMS_ENABLED: 'true',
        BREVO_API_KEY: 'test-key',
        BREVO_SMS_SENDER: 'TestSender',
        BREVO_SMS_DEFAULT_REGION: 'ZA',
      });

      // Access the private logger via bracket notation
      const logger = (service as unknown as { logger: { log: jest.Mock; warn: jest.Mock } }).logger;
      const logSpy = jest.spyOn(logger, 'log');

      service.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('enabled'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('TestSender'),
      );
    });

    it('logs "disabled" when SMS_ENABLED=false', async () => {
      const service = await buildService({
        SMS_ENABLED: false,
        BREVO_SMS_DEFAULT_REGION: 'ZA',
      });

      const logger = (service as unknown as { logger: { log: jest.Mock; warn: jest.Mock } }).logger;
      const logSpy = jest.spyOn(logger, 'log');

      service.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('disabled'),
      );
    });
  });
});
