const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const validEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL.test(v.trim());
export const validName = (v) => typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 50;
export const validPassword = (v) => typeof v === 'string' && v.length >= 8 && Buffer.byteLength(v) <= 72;
