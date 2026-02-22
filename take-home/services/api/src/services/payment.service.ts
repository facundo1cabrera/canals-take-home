import { injectable } from 'tsyringe';
import { PaymentFailedError } from '../lib/errors';


@injectable()
export class PaymentService {
  charge(creditCardNumber: string, _amountCents: number): void {
    const digits = creditCardNumber.replace(/\D/g, '');
    const lastDigit = digits.length > 0 ? parseInt(digits[digits.length - 1]!, 10) : 0;
    if (lastDigit % 2 !== 0) {
      throw new PaymentFailedError('Payment declined (mock: card ends in odd digit)');
    }
  }
}
