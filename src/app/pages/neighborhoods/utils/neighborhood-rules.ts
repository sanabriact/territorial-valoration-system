import { Commune } from '../../../models/Commune';
import {
  Neighborhood,
  NeighborhoodDependencies,
  NeighborhoodFormValue,
  NeighborhoodListItem,
  NeighborhoodRequest,
} from '../../../models/Neighborhood';

export class NeighborhoodRules {
  static toListItem(neighborhood: Neighborhood, communes: Commune[]): NeighborhoodListItem {
    return {
      ...neighborhood,
      communeName: communes.find((commune) => commune.id_commune === neighborhood.id_commune)?.name ?? 'Sin comuna',
    };
  }

  static hasDuplicatedName(
    neighborhoods: Neighborhood[],
    value: NeighborhoodFormValue,
    excludedNeighborhoodId?: number,
  ): boolean {
    const normalizedName = this.normalize(value.name);

    return neighborhoods.some(
      (neighborhood) =>
        neighborhood.id_commune === Number(value.id_commune) &&
        this.normalize(neighborhood.name) === normalizedName &&
        neighborhood.id_neighborhood !== excludedNeighborhoodId,
    );
  }

  static toRequest(value: NeighborhoodFormValue): NeighborhoodRequest {
    return {
      id_commune: Number(value.id_commune),
      name: value.name.trim(),
      status: value.status,
    };
  }

  static hasDependencies(dependencies: NeighborhoodDependencies): boolean {
    return dependencies.points.length > 0 || dependencies.annotations.length > 0;
  }

  static dependencyMessage(dependencies: NeighborhoodDependencies): string {
    const pointLabels = dependencies.points.map(
      (point) => `Punto #${point.id_point} (${point.point_type || 'sin tipo'})`,
    );
    const annotationLabels = dependencies.annotations.map(
      (annotation) => `Anotacion #${annotation.id_annotation}: ${annotation.description}`,
    );

    return [...pointLabels, ...annotationLabels].join('\n');
  }

  private static normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
