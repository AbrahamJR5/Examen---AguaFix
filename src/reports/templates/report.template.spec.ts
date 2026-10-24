import { generateReportTemplate } from './report.template';
import { reportDto } from '../../../test/photo';

it('includes the photo and every required report field', () => {
  const html = generateReportTemplate(
    reportDto,
    'https://example.com/photo.png',
  );
  for (const value of Object.values(reportDto)) expect(html).toContain(value);
  expect(html).toContain('<img src="https://example.com/photo.png"');
});

it('escapes citizen input instead of inserting arbitrary HTML', () => {
  const html = generateReportTemplate(
    { ...reportDto, description: '<script>alert(1)</script>' },
    'https://example.com/photo.png',
  );
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
});
