export interface ReportTemplateDto {
  address: string;
  description: string;
  severity: string;
  reporterPhone: string;
}

export const generateReportTemplate = (dto: ReportTemplateDto): string => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        
        <div style="background-color: #0056b3; color: white; padding: 15px; text-align: center;">
          <h2 style="margin: 0;">🚨 Nuevo Reporte de Fuga de Agua</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Se ha registrado un nuevo reporte en el sistema AguaFix. A continuación, los detalles para la cuadrilla de mantenimiento:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <th style="padding: 10px; border: 1px solid #ddd; background-color: #f4f4f4; text-align: left; width: 35%;">📍 Dirección</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${dto.address}</td>
            </tr>
            <tr>
              <th style="padding: 10px; border: 1px solid #ddd; background-color: #f4f4f4; text-align: left;">📝 Descripción</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${dto.description}</td>
            </tr>
            <tr>
              <th style="padding: 10px; border: 1px solid #ddd; background-color: #f4f4f4; text-align: left;">⚠️ Severidad</th>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; text-transform: uppercase;">${dto.severity}</td>
            </tr>
            <tr>
              <th style="padding: 10px; border: 1px solid #ddd; background-color: #f4f4f4; text-align: left;">📞 Tel. Contacto</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${dto.reporterPhone}</td>
            </tr>
          </table>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">Por favor, asigne una cuadrilla para su atención lo antes posible.</p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};