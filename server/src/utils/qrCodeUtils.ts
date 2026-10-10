import QRCode from 'qrcode';
import crypto from 'crypto';

const getSecret = () => process.env.JWT_SECRET || 'madrasa_super_secret_jwt_key_2024';

export function buildVerificationUrl(type: string, id: string, sig: string): string {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  return `${baseUrl}/verify?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}&sig=${encodeURIComponent(sig)}`;
}

export async function generateVerificationQr(
  type: 'payment' | 'result' | 'payslip' | 'student',
  id: string,
  tenantId: string
): Promise<string> {
  // We include tenantId in the generation if we want, but for verification we just need type and id as per requirements.
  // Let's just sign type and id.
  const payload = `${type}:${id}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  const url = buildVerificationUrl(type, id, sig);
  return QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, scale: 5 });
}

export function verifyQrSignature(type: string, id: string, sig: string): boolean {
  const payload = `${type}:${id}`;
  const expectedSig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return sig === expectedSig;
}
