import { AnnotationCategory } from '../../../../../models/Annotation';
import { Category } from '../../../../../models/Category';
import { Commune } from '../../../../../models/Commune';
import { Evidence } from '../../../../../models/Evidence';
import { Neighborhood } from '../../../../../models/Neighborhood';
import { Point } from '../../../../../models/Point';
import { Vote } from '../../../../../models/Vote';
import { getDescendantCategoryIds, resolveCategoryDisplayImageUrl } from '../../../../../utils/category-image-url';
import { AnnotationExplorerItem, AnnotationPolygon, CategoryTreeNode } from '../models/annotation-explorer.model';
import { Annotation } from '../../../../../models/Annotation';

const CATEGORY_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#14b8a6'];

export function buildAnnotationItems(
  annotations: Annotation[],
  annotationCategories: AnnotationCategory[],
  categories: Category[],
  evidences: Evidence[],
  votes: Vote[],
  neighborhoods: Neighborhood[],
  communes: Commune[],
): AnnotationExplorerItem[] {
  return annotations
    .filter((annotation) => Number.isFinite(Number(annotation.latitude)) && Number.isFinite(Number(annotation.longitude)))
    .map((annotation) => {
      const linkedCategoryIds = annotationCategories
        .filter((item) => Number(item.id_annotation) === Number(annotation.id_annotation))
        .map((item) => Number(item.id_category));
      const linkedCategories = categories.filter((category) => linkedCategoryIds.includes(Number(category.id_category)));
      const neighborhood = neighborhoods.find((item) => Number(item.id_neighborhood) === Number(annotation.id_neighborhood));
      const commune = communes.find((item) => Number(item.id_commune) === Number(neighborhood?.id_commune));
      const annotationVotes = votes.filter((vote) => Number(vote.id_annotation) === Number(annotation.id_annotation));

      return {
        annotation,
        categories: linkedCategories,
        evidences: evidences.filter((evidence) => Number(evidence.id_annotation) === Number(annotation.id_annotation)),
        votes: annotationVotes,
        neighborhoodName: neighborhood?.name ?? 'Sin barrio',
        communeId: neighborhood?.id_commune ?? null,
        communeName: commune?.name ?? 'Sin comuna',
        averageRating: getAverageRating(annotationVotes),
      };
    });
}

export function buildCategoryTree(categories: Category[], items: AnnotationExplorerItem[]): CategoryTreeNode[] {
  const nodes = new Map<number, CategoryTreeNode>();

  categories.forEach((category) => {
    nodes.set(Number(category.id_category), {
      ...category,
      children: [],
      annotationCount: countCategoryAnnotations(category, categories, items),
    });
  });

  const roots: CategoryTreeNode[] = [];
  nodes.forEach((node) => {
    const parentId = node.id_parent_category;
    const parent = parentId ? nodes.get(Number(parentId)) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  return roots;
}

export function getCategoryColor(categoryId: number | null): string {
  if (!categoryId) return CATEGORY_COLORS[CATEGORY_COLORS.length - 1];
  return CATEGORY_COLORS[Math.abs(categoryId) % CATEGORY_COLORS.length];
}

export function getCategoryMarkerImage(category: Category | null): string | null {
  return resolveCategoryDisplayImageUrl(category);
}

export function getNeighborhoodPolygons(
  neighborhoods: Neighborhood[],
  points: Point[],
  selectedNeighborhoodId: number | null,
): AnnotationPolygon[] {
  return neighborhoods
    .map((neighborhood) => {
      const polygonPoints = getOrderedDemarcationPoints(Number(neighborhood.id_neighborhood), points);

      return {
        id: Number(neighborhood.id_neighborhood),
        name: neighborhood.name,
        selected: selectedNeighborhoodId !== null && Number(neighborhood.id_neighborhood) === Number(selectedNeighborhoodId),
        points: polygonPoints,
      };
    })
    .filter((polygon) => polygon.points.length >= 3);
}

function getOrderedDemarcationPoints(neighborhoodId: number, points: Point[]) {
  return points
    .filter((point) =>
      Number(point.id_neighborhood) === Number(neighborhoodId) &&
      String(point.point_type).trim().toLowerCase() === 'demarcation',
    )
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((point) => ({ latitude: Number(point.latitude), longitude: Number(point.longitude) }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
}

function countCategoryAnnotations(category: Category, categories: Category[], items: AnnotationExplorerItem[]): number {
  const ids = getDescendantCategoryIds(category, categories);
  return items.filter((item) =>
    item.categories.some((linkedCategory) => ids.includes(Number(linkedCategory.id_category))),
  ).length;
}

function getAverageRating(votes: Vote[]): number {
  if (votes.length === 0) return 0;
  return votes.reduce((sum, vote) => sum + Number(vote.stars), 0) / votes.length;
}

