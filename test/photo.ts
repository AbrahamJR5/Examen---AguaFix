export const pngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0X8AAAAASUVORK5CYII=',
  'base64',
);

export const photo = {
  fieldname: 'photo',
  originalname: 'fuga.png',
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: pngBytes,
  size: pngBytes.length,
} as Express.Multer.File;

export const reportDto = {
  address: 'Calle de prueba 123',
  description: 'Fuga en la banqueta',
  severity: 'high',
  reporterPhone: '5551234567',
};
