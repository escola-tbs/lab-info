/**
 * Utilities for Brazilian WhatsApp phone formatting and normalization
 */

// Helper to remove non-digits and strip country code 55 if present on >=12 digit numbers
export function stripCountryCode(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  return digits;
}

// Format as user types or when loading profile: (91) 9 0000-0000
export function formatPhoneInput(value: string): string {
  if (!value) return '';
  // Strip non-digits and strip country code 55 if stored in database
  const digits = stripCountryCode(value);
  
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string; // e.g. "5591985048150"
  formattedDisplay: string; // e.g. "+55 (91) 9 8504-8150"
  error?: string;
}

export function validateAndNormalizeBRPhone(raw: string): PhoneValidationResult {
  if (!raw) {
    return { isValid: false, normalized: '', formattedDisplay: '', error: 'O número de WhatsApp é obrigatório.' };
  }

  // Strip country code if already present
  const cleanDigits = stripCountryCode(raw);

  if (cleanDigits.length === 0) {
    return { isValid: false, normalized: '', formattedDisplay: '', error: 'O número de WhatsApp é obrigatório.' };
  }

  if (cleanDigits.length < 10) {
    return { isValid: false, normalized: '', formattedDisplay: '', error: 'Número incompleto. Digite DDD + celular.' };
  }

  // 10 digits case: missing 9? In Brazil, all mobile phones have 9.
  if (cleanDigits.length === 10) {
    const ddd = cleanDigits.slice(0, 2);
    const dddNum = parseInt(ddd, 10);
    if (dddNum >= 11 && dddNum <= 99) {
      const withNine = `${ddd}9${cleanDigits.slice(2)}`;
      return {
        isValid: true,
        normalized: `55${withNine}`,
        formattedDisplay: `+55 (${ddd}) 9 ${withNine.slice(3, 7)}-${withNine.slice(7)}`,
      };
    }
  }

  if (cleanDigits.length === 11) {
    const ddd = cleanDigits.slice(0, 2);
    const dddNum = parseInt(ddd, 10);
    const firstDigit = cleanDigits.charAt(2);

    if (dddNum < 11 || dddNum > 99) {
      return { isValid: false, normalized: '', formattedDisplay: '', error: 'DDD inválido. Informe um DDD brasileiro válido (ex: 91).' };
    }

    if (firstDigit !== '9') {
      return { isValid: false, normalized: '', formattedDisplay: '', error: 'Celulares no Brasil devem iniciar com o dígito 9 após o DDD.' };
    }

    const normalized = `55${cleanDigits}`;
    const formattedDisplay = `+55 (${ddd}) 9 ${cleanDigits.slice(3, 7)}-${cleanDigits.slice(7)}`;
    return {
      isValid: true,
      normalized,
      formattedDisplay,
    };
  }

  return { isValid: false, normalized: '', formattedDisplay: '', error: 'Formato inválido. Use o padrão Ex: (91) 9 0000-0000.' };
}

// Format normalized database number (+5591985048150 or 5591985048150) for display in profile
export function formatNormalizedDisplay(phone: string): string {
  if (!phone) return '';
  const digits = stripCountryCode(phone);
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    return `+55 (${ddd}) 9 ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    return `+55 (${ddd}) 9 ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function buildWhatsAppLink(
  normalizedPhone: string,
  targetUserName: string,
  formattedDate: string,
  slotLabels: string
): string {
  const cleanPhone = normalizedPhone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const message = `Olá, ${targetUserName}! Vi sua reserva no Lab Info para o dia ${formattedDate} (${slotLabels}). Gostaria de verificar se haveria possibilidade de negociarmos ou ajustarmos esse horário. Desde já, muito obrigado(a)!`;

  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}
