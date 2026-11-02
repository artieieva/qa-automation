import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReminderService } from '../src/reminder-service';
import type { OrderProvider, Mailer } from '../src/reminder-service';
import { InMemoryReminderRepository } from './fakes/in-memory-reminder-repository';

describe('ReminderService', () => {
  let orderProvider: OrderProvider;
  let reminderRepo: InMemoryReminderRepository;
  let mailer: Mailer;
  let service: ReminderService;

  // Базова дата створення замовлення: 1 березня 2026 року
  const ORDER_CREATED_AT = '2026-03-01T10:00:00.000Z';

  beforeEach(() => {
    orderProvider = {
      getOrder: vi.fn().mockResolvedValue({
        id: 'ORDER-100',
        email: 'user@example.com',
        createdAt: ORDER_CREATED_AT,
      }),
    };

    reminderRepo = new InMemoryReminderRepository(); // Підробка зі станом
    mailer = { send: vi.fn().mockResolvedValue(undefined) }; // Шпигун

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
      // 1 березня + 6 днів = 7 березня
      vi.setSystemTime(new Date('2026-03-07T10:00:00.000Z'));

      const result = await service.checkAndSendReminder('ORDER-100');

      expect(result).toBe(false);
      expect(mailer.send).not.toHaveBeenCalled();
      expect(reminderRepo.count).toBe(0); // стан не змінився
    });

    it('Межа 7 днів (рівно 7 діб): лист НЕ надсилається (умова: понад 7 днів)', async () => {
      // 1 березня + 7 днів = 8 березня
      vi.setSystemTime(new Date('2026-03-08T10:00:00.000Z'));

      const result = await service.checkAndSendReminder('ORDER-100');

      expect(result).toBe(false);
      expect(mailer.send).not.toHaveBeenCalled();
      expect(reminderRepo.count).toBe(0);
    });

    it('Межа 8 днів: лист надсилається і фіксується стан', async () => {
      // 1 березня + 8 днів = 9 березня
      vi.setSystemTime(new Date('2026-03-09T10:00:00.000Z'));

      const result = await service.checkAndSendReminder('ORDER-100');

      expect(result).toBe(true);

      // Перевірка взаємодії (interaction check)
      expect(mailer.send).toHaveBeenCalledTimes(1);
      expect(mailer.send).toHaveBeenCalledWith(
        'user@example.com',
        'Нагадування про замовлення',
        expect.stringContaining('ORDER-100'),
      );

      // Перевірка стану через підробку (state check)
      expect(reminderRepo.count).toBe(1);
      expect(await reminderRepo.isReminderSent('ORDER-100')).toBe(true);
      expect(reminderRepo.getSentDate('ORDER-100')).toBe('2026-03-09T10:00:00.000Z');
    });

    it('не надсилає лист повторно, якщо нагадування вже було збережене в сховищі', async () => {
      vi.setSystemTime(new Date('2026-03-09T10:00:00.000Z'));
      // Заздалегідь записуємо стан у підробку
      await reminderRepo.saveSentReminder('ORDER-100', '2026-03-09T08:00:00.000Z');

      const result = await service.checkAndSendReminder('ORDER-100');

      expect(result).toBe(false);
      expect(mailer.send).not.toHaveBeenCalled();
    });
  });

  describe('Сценарії відмови залежностей', () => {
    it('Сценарій збою 1: сервіс замовлень недоступний', async () => {
      orderProvider.getOrder = vi.fn().mockRejectedValue(new Error('ORDER_SERVICE_DOWN'));

      await expect(service.checkAndSendReminder('ORDER-100')).rejects.toThrow('ORDER_SERVICE_DOWN');

      // Переконуємося, що побічні дії не виконались
      expect(mailer.send).not.toHaveBeenCalled();
      expect(reminderRepo.count).toBe(0);
    });

    it('Сценарій збою 2: поштовий сервіс впав — стан у репозиторії не зберігається', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-09T10:00:00.000Z')); // 8 днів

      mailer.send = vi.fn().mockRejectedValue(new Error('SMTP_CONNECTION_REFUSED'));

      await expect(service.checkAndSendReminder('ORDER-100')).rejects.toThrow('SMTP_CONNECTION_REFUSED');

      // Перевірка стану: статус не повинен позначитися як відправлений, якщо лист не пішов
      expect(reminderRepo.count).toBe(0);
      expect(await reminderRepo.isReminderSent('ORDER-100')).toBe(false);

      vi.useRealTimers();
    });
  });
});