export interface OrderDto {
  id: string;
  email: string;
  createdAt: string; // ISO date string
}

export interface OrderProvider {
  getOrder(id: string): Promise<OrderDto>;
}

export interface ReminderRepository {
  saveSentReminder(orderId: string, sentAt: string): Promise<void>;
  isReminderSent(orderId: string): Promise<boolean>;
}

export interface Mailer {
  send(email: string, subject: string, body: string): Promise<void>;
}

export class ReminderService {
  constructor(
    private orderProvider: OrderProvider,
    private reminderRepo: ReminderRepository,
    private mailer: Mailer,
  ) {}

  async checkAndSendReminder(orderId: string): Promise<boolean> {
    const order = await this.orderProvider.getOrder(orderId);

    const orderTime = new Date(order.createdAt).getTime();
    if (isNaN(orderTime)) {
      throw new Error('INVALID_ORDER_DATE');
    }

    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    // Умова: минуло ПОНАД 7 днів (> 7 днів)
    if (now - orderTime <= SEVEN_DAYS_MS) {
      return false;
    }

    const alreadySent = await this.reminderRepo.isReminderSent(order.id);
    if (alreadySent) {
      return false;
    }

    await this.mailer.send(
      order.email,
      'Нагадування про замовлення',
      `Замовлення ${order.id} очікує на вашу увагу.`,
    );

    await this.reminderRepo.saveSentReminder(order.id, new Date(now).toISOString());
    return true;
  }
}