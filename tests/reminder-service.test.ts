import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReminderService } from '../src/reminder-service';
import type { OrderProvider, Mailer } from '../src/reminder-service';
import { InMemoryReminderRepository } from './fakes/in-memory-reminder-repository';

describe('ReminderService', () => {
  let orderProvider: OrderProvider;
  let reminderRepo: InMemoryReminderRepository;
  let mailer: Mailer;
  let service: ReminderService;

  const ORDER_CREATED_AT = '2026-03-01T10:00:00.000Z';

  beforeEach(() => {
    orderProvider = {
      getOrder: vi.fn().mockResolvedValue({
        id: 'ORDER-100',
        email: 'user@example.com',
        createdAt: ORDER_CREATED_AT,
      }),
    };

    reminderRepo = new InMemoryReminderRepository();
    mailer = { send: vi.fn().mockResolvedValue(undefined) };

    service = new ReminderService(orderProvider, reminderRepo, mailer);
  });

  describe('Перевірка меж 6, 7, 8 днів через підміну системного часу', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('Межа 6 днів: лист НЕ надсилається', async () => {
      vi.setSystemTime(new Date('2026-03-07T10:00:00.000Z'));

      const result = await service.checkAndSendReminder('ORDER-100');

      expect(result).toBe(false);
      expect(mailer.send).not.toHaveBeenCalled();
      expect(reminderRepo.count).toBe(0);
    });

    it('Межа 7 днів: лист НЕ надсилається (умова: понад 7 днів)', async () => {
      vi.setSystemTime(new Date('2026-03-08T10:00:00.000Z'));

      const result = await service.checkAndSendReminder('ORDER-100');

      expect(result).toBe(false);
      expect(mailer.send).not.toHaveBeenCalled();
      expect(reminderRepo.count).toBe(0);
    });

    it('Межа 8 днів: лист надсилається і фіксується стан', async () => {
      vi.setSystemTime(new Date('2026-03-09T10:00:00.000Z'));

      const result = await service.checkAndSendReminder('ORDER-100');

      expect(result).toBe(true);
      expect(mailer.send).toHaveBeenCalledTimes(1);
      expect(mailer.send).toHaveBeenCalledWith(
        'user@example.com',
        'Нагадування про замовлення',
        expect.stringContaining('ORDER-100'),
      );
      expect(reminderRepo.count).toBe(1);
      expect(await reminderRepo.isReminderSent('ORDER-100')).toBe(true);
      expect(reminderRepo.getSentDate('ORDER-100')).toBe('2026-03-09T10:00:00.000Z');
    });

    it('не надсилає лист повторно, якщо нагадування вже було збережене в сховищі', async () => {
      vi.setSystemTime(new Date('2026-03-09T10:00:00.000Z'));
      await reminderRepo.saveSentReminder('ORDER-100', '2026-03-09T08:00:00.000Z');

      const result = await service.checkAndSendReminder('ORDER-100');

      expect(result).toBe(false);
      expect(mailer.send).not.toHaveBeenCalled();
    });
  });

  describe('Сценарії відмови залежностей та некоректних даних', () => {
    it('викидає помилку, якщо дата замовлення невалідна (покриття рядка 32)', async () => {
      orderProvider.getOrder = vi.fn().mockResolvedValue({
        id: 'ORDER-BAD-DATE',
        email: 'user@example.com',
        createdAt: 'not-a-valid-date',
      });

      await expect(
        service.checkAndSendReminder('ORDER-BAD-DATE'),
      ).rejects.toThrow('INVALID_ORDER_DATE');

      expect(mailer.send).not.toHaveBeenCalled();
      expect(reminderRepo.count).toBe(0);
    });

    it('Сценарій збою 1: сервіс замовлень недоступний', async () => {
      orderProvider.getOrder = vi.fn().mockRejectedValue(new Error('ORDER_SERVICE_DOWN'));

      await expect(
        service.checkAndSendReminder('ORDER-100'),
      ).rejects.toThrow('ORDER_SERVICE_DOWN');

      expect(mailer.send).not.toHaveBeenCalled();
      expect(reminderRepo.count).toBe(0);
    });

    it('Сценарій збою 2: поштовий сервіс впав — стан у репозиторії не зберігається', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-09T10:00:00.000Z'));

      mailer.send = vi.fn().mockRejectedValue(new Error('SMTP_CONNECTION_REFUSED'));

      await expect(
        service.checkAndSendReminder('ORDER-100'),
      ).rejects.toThrow('SMTP_CONNECTION_REFUSED');

      expect(reminderRepo.count).toBe(0);
      expect(await reminderRepo.isReminderSent('ORDER-100')).toBe(false);

      vi.useRealTimers();
    });
  });
});