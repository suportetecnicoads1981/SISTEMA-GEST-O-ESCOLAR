/**
 * SucessoEdu Gestão Educacional - Gerador de Ícones Nativos (.ICO e .PNG)
 * Cria ícone de alta resolução compatível com Área de Trabalho do Windows (7, 8, 10, 11)
 */

export async function createSucessoEduIconUint8Array(): Promise<Uint8Array> {
  if (typeof document === 'undefined') {
    // Fallback if running outside DOM
    return new Uint8Array([0, 0, 1, 0, 1, 0, 32, 32, 0, 0, 1, 0, 32, 0, 0, 0, 0, 0, 22, 0, 0, 0]);
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 1. Background rounded shield / circle
      ctx.fillStyle = '#0f172a'; // Slate 900
      ctx.beginPath();
      ctx.roundRect(2, 2, 60, 60, 14);
      ctx.fill();

      // Border gradient
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#3b82f6'; // Blue 500
      ctx.stroke();

      // Inner glow circle
      ctx.beginPath();
      ctx.arc(32, 32, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#1e3a8a'; // Blue 900
      ctx.fill();

      // 2. Graduation Cap / Hat (Golden Yellow & White)
      ctx.fillStyle = '#fbbf24'; // Amber 400
      ctx.beginPath();
      // Cap diamond
      ctx.moveTo(32, 18);
      ctx.lineTo(48, 25);
      ctx.lineTo(32, 32);
      ctx.lineTo(16, 25);
      ctx.closePath();
      ctx.fill();

      // Cap base
      ctx.fillStyle = '#f59e0b'; // Amber 500
      ctx.beginPath();
      ctx.moveTo(22, 28);
      ctx.lineTo(22, 36);
      ctx.bezierCurveTo(22, 42, 42, 42, 42, 36);
      ctx.lineTo(42, 28);
      ctx.bezierCurveTo(42, 33, 22, 33, 22, 28);
      ctx.closePath();
      ctx.fill();

      // Tassel
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, 25);
      ctx.lineTo(50, 36);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(50, 37, 2, 0, Math.PI * 2);
      ctx.fill();

      // 3. Open Book / Pages under cap
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(20, 44);
      ctx.lineTo(32, 47);
      ctx.lineTo(44, 44);
      ctx.lineTo(44, 49);
      ctx.lineTo(32, 52);
      ctx.lineTo(20, 49);
      ctx.closePath();
      ctx.fill();

      // Center divider
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 47);
      ctx.lineTo(32, 52);
      ctx.stroke();
    }

    // Convert Canvas to PNG Blob
    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (!pngBlob) {
      return new Uint8Array();
    }

    const pngBuffer = await pngBlob.arrayBuffer();
    const pngBytes = new Uint8Array(pngBuffer);
    const pngSize = pngBytes.length;

    // Construct valid Windows .ICO header (22 bytes header + PNG payload)
    // Header (6 bytes)
    // 0-1: Reserved (0)
    // 2-3: Type (1 = ICO)
    // 4-5: Count (1 image)
    // Directory Entry (16 bytes)
    // 6: Width (64)
    // 7: Height (64)
    // 8: Colors (0 = No palette)
    // 9: Reserved (0)
    // 10-11: Color Planes (1)
    // 12-13: Bits per Pixel (32)
    // 14-17: Size of image data in bytes (little-endian 32-bit)
    // 18-21: Offset of image data from beginning of file (22, little-endian)
    const icoHeader = new Uint8Array(22);
    icoHeader[0] = 0;
    icoHeader[1] = 0;
    icoHeader[2] = 1; // Type ICO
    icoHeader[3] = 0;
    icoHeader[4] = 1; // 1 image
    icoHeader[5] = 0;

    icoHeader[6] = 64; // Width 64px
    icoHeader[7] = 64; // Height 64px
    icoHeader[8] = 0; // Palette count
    icoHeader[9] = 0; // Reserved
    icoHeader[10] = 1; // Planes
    icoHeader[11] = 0;
    icoHeader[12] = 32; // 32 bits bpp
    icoHeader[13] = 0;

    // Size of PNG in little-endian
    icoHeader[14] = pngSize & 0xff;
    icoHeader[15] = (pngSize >> 8) & 0xff;
    icoHeader[16] = (pngSize >> 16) & 0xff;
    icoHeader[17] = (pngSize >> 24) & 0xff;

    // Offset (22 bytes) in little-endian
    icoHeader[18] = 22;
    icoHeader[19] = 0;
    icoHeader[20] = 0;
    icoHeader[21] = 0;

    // Combine Header + PNG
    const icoFile = new Uint8Array(22 + pngSize);
    icoFile.set(icoHeader, 0);
    icoFile.set(pngBytes, 22);

    return icoFile;
  } catch (err) {
    console.error('Falha ao gerar arquivo de icone .ico:', err);
    return new Uint8Array();
  }
}
