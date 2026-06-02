export function resolveBackendFileUrl(fileUrl: string | null | undefined): string {
  const fallback = 'imagen_por_defecto.png';
  const value = fileUrl?.trim();

  if (!value) return fallback;
  if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  const normalized = value.replace(/\\/g, '/');

  if (normalized.startsWith('/api/')) return normalized;
  if (normalized.startsWith('/uploads/') || normalized.startsWith('/static/') || normalized.startsWith('/images/')) {
    return normalized;
  }

  if (normalized.startsWith('uploads/') || normalized.startsWith('static/') || normalized.startsWith('images/')) {
    return `/${normalized}`;
  }

  return `/uploads/${normalized}`;
}
