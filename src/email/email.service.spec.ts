import { jest } from '@jest/globals';
import { EmailService } from './email.service';

describe('EmailService', () => {
  it('sends HTML to the requested recipient', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'test-message' });
    const service = new EmailService();
    Object.assign(service, { transporter: { sendMail } });
    await service.sendEmail(
      'crew@example.invalid',
      'Nuevo reporte',
      '<img src="https://example.com/photo.png">',
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'crew@example.invalid',
        subject: 'Nuevo reporte',
        html: '<img src="https://example.com/photo.png">',
      }),
    );
  });
});
