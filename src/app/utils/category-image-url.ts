import { resolveBackendFileUrl } from './file-url';

export function resolveCategoryImageUrl(imageUrl: string | null | undefined): string {
  return resolveBackendFileUrl(imageUrl);
}
