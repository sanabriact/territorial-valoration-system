import { resolveBackendFileUrl } from './file-url';
import { Category } from '../models/Category';

interface CategoryDefaultImage {
  aliases: string[];
  imageUrl: string;
}

const DEFAULT_CATEGORY_IMAGES: CategoryDefaultImage[] = [
  {
    aliases: ['infrastructure', 'infraestructure', 'inftrastructure', 'infraestructura', 'infraestructuras'],
    imageUrl: '/Infrastructure.png',
  },
  {
    aliases: ['roads and sidewalks', 'road and sidewalk', 'road', 'roads', 'sidewalk', 'sidewalks', 'vias y andenes', 'vías y andenes', 'andenes'],
    imageUrl: '/street.png',
  },
];

export function resolveCategoryImageUrl(imageUrl: string | null | undefined): string {
  return resolveBackendFileUrl(imageUrl);
}

export function resolveCategoryDisplayImageUrl(category: Category | null | undefined): string | null {
  if (!category) return null;

  const imageUrl = category.image_url?.trim();
  if (imageUrl) return resolveCategoryImageUrl(imageUrl);

  return getDefaultCategoryImageUrl(category.name);
}

export function getDefaultCategoryImageUrl(categoryName: string | null | undefined): string | null {
  const normalizedName = normalizeCategoryName(categoryName ?? '');
  const defaultImage = DEFAULT_CATEGORY_IMAGES.find((item) =>
    item.aliases.some((alias) => normalizedName.includes(normalizeCategoryName(alias))),
  );

  return defaultImage?.imageUrl ?? null;
}

export function getDescendantCategoryIds(category: Category, categories: Category[]): number[] {
  const categoryId = Number(category.id_category);
  const children = categories.filter((item) => Number(item.id_parent_category) === categoryId);
  return [categoryId, ...children.flatMap((child) => getDescendantCategoryIds(child, categories))];
}

export function categoryMatchesSelection(
  categories: Category[],
  linkedCategories: Category[],
  selectedCategoryIds: number[],
): boolean {
  if (selectedCategoryIds.length === 0) return true;

  return selectedCategoryIds.some((selectedCategoryId) => {
    const selectedCategory = categories.find((category) => Number(category.id_category) === Number(selectedCategoryId));
    if (!selectedCategory) return false;

    const acceptedIds = getDescendantCategoryIds(selectedCategory, categories);
    return linkedCategories.some((category) => acceptedIds.includes(Number(category.id_category)));
  });
}

export function getFirstMatchingCategory(
  categories: Category[],
  linkedCategories: Category[],
  selectedCategoryIds: number[],
): Category | null {
  if (selectedCategoryIds.length === 0) return linkedCategories[0] ?? null;

  for (const selectedCategoryId of selectedCategoryIds) {
    const selectedCategory = categories.find((category) => Number(category.id_category) === Number(selectedCategoryId));
    if (!selectedCategory) continue;

    const acceptedIds = getDescendantCategoryIds(selectedCategory, categories);
    const matchingCategory = linkedCategories.find((category) => acceptedIds.includes(Number(category.id_category)));
    if (matchingCategory) return matchingCategory;
  }

  return linkedCategories[0] ?? null;
}

export function normalizeCategoryName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
