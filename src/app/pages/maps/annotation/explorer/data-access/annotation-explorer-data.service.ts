import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AnnotationService } from '../../../../../services/annotations/annotation.service';
import { CategoryService } from '../../../../../services/categories/category.service';
import { CommuneService } from '../../../../../services/communes/commune.service';
import { EvidenceService } from '../../../../../services/evidences/evidence.service';
import { NeighborhoodService } from '../../../../../services/neighborhoods/neighborhood.service';
import { PointService } from '../../../../../services/points/point.service';
import { VoteService } from '../../../../../services/votes/vote.service';

@Injectable({ providedIn: 'root' })
export class AnnotationExplorerDataService {
  private readonly annotationService = inject(AnnotationService);
  private readonly categoryService = inject(CategoryService);
  private readonly communeService = inject(CommuneService);
  private readonly neighborhoodService = inject(NeighborhoodService);
  private readonly pointService = inject(PointService);
  private readonly evidenceService = inject(EvidenceService);
  private readonly voteService = inject(VoteService);

  loadExplorerData() {
    return forkJoin({
      annotations: this.annotationService.getAll(),
      annotationCategories: this.annotationService.getAnnotationCategories(),
      categories: this.categoryService.getAll(),
      communes: this.communeService.getAll(),
      neighborhoods: this.neighborhoodService.getAll(),
      points: this.pointService.getAll(),
      evidences: this.evidenceService.getAll(),
      votes: this.voteService.getAll(),
    });
  }
}
