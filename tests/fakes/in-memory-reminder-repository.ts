import type { ReminderRepository } from '../../src/reminder-service';

export class InMemoryReminderRepository implements ReminderRepository {
  private reminders = new Map<string, string>(); // orderId -> sentAt

  async saveSentReminder(orderId: string, sentAt: string): Promise<void> {
    this.reminders.set(orderId, sentAt);
  }

  async isReminderSent(orderId: string): Promise<boolean> {
    return this.reminders.has(orderId);
  }

  get count(): number {
    return this.reminders.size;
  }

  getSentDate(orderId: string): string | undefined {
    return this.reminders.get(orderId);
  }
}