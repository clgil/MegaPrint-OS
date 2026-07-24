import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface PDFGenerationOptions {
  workshopName: string;
  workshopAddress?: string;
  workshopPhone?: string;
  workshopEmail?: string;
  workshopLogo?: string;
  warrantyTerms?: string;
}

interface OrderData {
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  equipmentBrand: string;
  equipmentModel: string;
  serialNumber?: string;
  reportedIssue: string;
  aestheticState: {
    scratches: boolean;
    dents: boolean;
    missingParts: boolean;
    screenDamage: boolean;
    otherDamage: boolean;
    notes?: string;
  };
  diagnosis?: string;
  solutionApplied?: string;
  laborCost?: number;
  partsCost?: number;
  totalPrice?: number;
  receivedAt: string;
  customerSignature?: string;
}

const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const generateReceptionHTML = (order: OrderData, config: PDFGenerationOptions): string => {
  const aestheticChecks = [
    order.aestheticState.scratches ? '✓ Rayones' : '',
    order.aestheticState.dents ? '✓ Golpes' : '',
    order.aestheticState.missingParts ? '✓ Piezas Faltantes' : '',
    order.aestheticState.screenDamage ? '✓ Pantalla Dañada' : '',
    order.aestheticState.otherDamage ? '✓ Otros Daños' : '',
  ].filter(Boolean).join(', ') || 'Ninguno';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #2c3e50; }
    .header p { margin: 5px 0; color: #666; }
    .title { background-color: #3498db; color: white; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; }
    .section { margin: 15px 0; }
    .section-title { font-weight: bold; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; margin: 5px 0; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; }
    .aesthetic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
    .signature-box { border: 1px solid #333; height: 100px; margin-top: 10px; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
    .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 15px 0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${config.workshopName}</h1>
    ${config.workshopAddress ? `<p>${config.workshopAddress}</p>` : ''}
    ${config.workshopPhone ? `<p>Tel: ${config.workshopPhone}</p>` : ''}
    ${config.workshopEmail ? `<p>Email: ${config.workshopEmail}</p>` : ''}
  </div>

  <div class="title">COMPROBANTE DE RECEPCIÓN</div>

  <div class="section">
    <div class="section-title">Datos de la Orden</div>
    <div class="row"><span class="label">Número de Orden:</span><span class="value">${order.orderNumber}</span></div>
    <div class="row"><span class="label">Fecha de Recepción:</span><span class="value">${formatDate(order.receivedAt)}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Datos del Cliente</div>
    <div class="row"><span class="label">Nombre:</span><span class="value">${order.clientName}</span></div>
    <div class="row"><span class="label">Teléfono:</span><span class="value">${order.clientPhone}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Equipo Recibido</div>
    <div class="row"><span class="label">Marca:</span><span class="value">${order.equipmentBrand}</span></div>
    <div class="row"><span class="label">Modelo:</span><span class="value">${order.equipmentModel}</span></div>
    ${order.serialNumber ? `<div class="row"><span class="label">Número de Serie:</span><span class="value">${order.serialNumber}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Falla Reportada</div>
    <div class="value">${order.reportedIssue}</div>
  </div>

  <div class="section">
    <div class="section-title">Estado Estético del Equipo</div>
    <div class="aesthetic-grid">
      <div>${order.aestheticState.scratches ? '☑ Rayones' : '☐ Rayones'}</div>
      <div>${order.aestheticState.dents ? '☑ Golpes/Abolladuras' : '☐ Golpes/Abolladuras'}</div>
      <div>${order.aestheticState.missingParts ? '☑ Piezas Faltantes' : '☐ Piezas Faltantes'}</div>
      <div>${order.aestheticState.screenDamage ? '☑ Pantalla Dañada' : '☐ Pantalla Dañada'}</div>
      <div>${order.aestheticState.otherDamage ? '☑ Otros Daños' : '☐ Otros Daños'}</div>
    </div>
    ${order.aestheticState.notes ? `<p style="margin-top: 10px;"><strong>Notas adicionales:</strong> ${order.aestheticState.notes}</p>` : ''}
  </div>

  <div class="warning">
    <strong>Importante:</strong> Este comprobante acredita la recepción del equipo para diagnóstico. 
    El equipo será evaluado y se le contactará con el presupuesto. MegaPrint OS no se hace responsable 
    por equipos no reclamados después de 90 días.
  </div>

  ${order.customerSignature ? `
  <div class="section">
    <div class="section-title">Firma del Cliente</div>
    <img src="${order.customerSignature}" class="signature-box" alt="Firma del cliente" />
  </div>
  ` : '<div class="section"><div class="section-title">Firma del Cliente</div><div class="signature-box"></div></div>'}

  <div class="footer">
    <p>Generado por MegaPrint OS - Sistema de Gestión para Talleres</p>
    <p>Fecha de impresión: ${new Date().toLocaleDateString('es-ES')}</p>
  </div>
</body>
</html>
  `;
};

const generateDeliveryHTML = (order: OrderData, config: PDFGenerationOptions): string => {
  const totalPartsCost = order.partsCost || 0;
  const totalLaborCost = order.laborCost || 0;
  const grandTotal = order.totalPrice || (totalPartsCost + totalLaborCost);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #2c3e50; }
    .header p { margin: 5px 0; color: #666; }
    .title { background-color: #27ae60; color: white; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; }
    .section { margin: 15px 0; }
    .section-title { font-weight: bold; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; margin: 5px 0; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; }
    .totals { background-color: #f8f9fa; padding: 15px; margin: 15px 0; }
    .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
    .grand-total { font-size: 18px; font-weight: bold; color: #27ae60; border-top: 2px solid #27ae60; padding-top: 10px; margin-top: 10px; }
    .signature-box { border: 1px solid #333; height: 100px; margin-top: 10px; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
    .warranty { background-color: #d4edda; border: 1px solid #28a745; padding: 10px; margin: 15px 0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${config.workshopName}</h1>
    ${config.workshopAddress ? `<p>${config.workshopAddress}</p>` : ''}
    ${config.workshopPhone ? `<p>Tel: ${config.workshopPhone}</p>` : ''}
    ${config.workshopEmail ? `<p>Email: ${config.workshopEmail}</p>` : ''}
  </div>

  <div class="title">ORDEN DE ENTREGA Y GARANTÍA</div>

  <div class="section">
    <div class="section-title">Datos de la Orden</div>
    <div class="row"><span class="label">Número de Orden:</span><span class="value">${order.orderNumber}</span></div>
    <div class="row"><span class="label">Fecha de Entrega:</span><span class="value">${formatDate(new Date().toISOString())}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Datos del Cliente</div>
    <div class="row"><span class="label">Nombre:</span><span class="value">${order.clientName}</span></div>
    <div class="row"><span class="label">Teléfono:</span><span class="value">${order.clientPhone}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Equipo</div>
    <div class="row"><span class="label">Marca:</span><span class="value">${order.equipmentBrand}</span></div>
    <div class="row"><span class="label">Modelo:</span><span class="value">${order.equipmentModel}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Diagnóstico Técnico</div>
    <div class="value">${order.diagnosis || 'No especificado'}</div>
  </div>

  <div class="section">
    <div class="section-title">Solución Aplicada</div>
    <div class="value">${order.solutionApplied || 'No especificado'}</div>
  </div>

  <div class="section">
    <div class="section-title">Detalle de Costos</div>
    <div class="totals">
      <div class="total-row">
        <span class="label">Mano de Obra:</span>
        <span class="value">${formatCurrency(totalLaborCost)}</span>
      </div>
      <div class="total-row">
        <span class="label">Repuestos/Piezas:</span>
        <span class="value">${formatCurrency(totalPartsCost)}</span>
      </div>
      <div class="total-row grand-total">
        <span>TOTAL A PAGAR:</span>
        <span>${formatCurrency(grandTotal)}</span>
      </div>
    </div>
  </div>

  ${config.warrantyTerms ? `
  <div class="warranty">
    <strong>Términos de Garantía:</strong><br/>
    ${config.warrantyTerms}
  </div>
  ` : `
  <div class="warranty">
    <strong>Términos de Garantía:</strong><br/>
    Este servicio tiene una garantía de 30 días por defectos de fabricación o instalación. 
    La garantía no cubre mal uso, golpes, líquidos o manipulaciones por terceros.
  </div>
  `}

  ${order.customerSignature ? `
  <div class="section">
    <div class="section-title">Firma de Conformidad del Cliente</div>
    <img src="${order.customerSignature}" class="signature-box" alt="Firma del cliente" />
  </div>
  ` : '<div class="section"><div class="section-title">Firma de Conformidad del Cliente</div><div class="signature-box"></div></div>'}

  <div class="footer">
    <p>Generado por MegaPrint OS - Sistema de Gestión para Talleres</p>
    <p>¡Gracias por su confianza!</p>
  </div>
</body>
</html>
  `;
};

export const pdfService = {
  async generateReceptionPDF(order: OrderData, config: PDFGenerationOptions): Promise<string> {
    const html = generateReceptionHTML(order, config);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    console.log('PDF generado:', uri);
    return uri;
  },

  async generateDeliveryPDF(order: OrderData, config: PDFGenerationOptions): Promise<string> {
    const html = generateDeliveryHTML(order, config);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    console.log('PDF generado:', uri);
    return uri;
  },

  async sharePDF(uri: string, filename: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir PDF',
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error('Sharing no está disponible en este dispositivo');
    }
  },

  async shareViaWhatsApp(uri: string, phoneNumber?: string): Promise<void> {
    // WhatsApp sharing via Intent on Android
    const shareUrl = encodeURIComponent(uri);
    const message = encodeURIComponent('Aquí está su comprobante de MegaPrint OS');
    
    // This will open WhatsApp with the file to share
    await this.sharePDF(uri, `Orden_${phoneNumber || 'cliente'}.pdf`);
  },
};

export default pdfService;
