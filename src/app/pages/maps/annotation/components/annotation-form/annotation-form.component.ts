import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../../../models/Category';
import { Entity } from '../../../../../models/Entity';
import { resolveCategoryImageUrl } from '../../../../../utils/category-image-url';
import { AnnotationFormValue } from '../../models/annotation-map.model';

@Component({
  selector: 'app-annotation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annotation-form.component.html',
  styleUrl: './annotation-form.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AnnotationFormComponent {
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly categories = input<Category[]>([]);
  readonly entities = input<Entity[]>([]);
  readonly saving = input(false);

  readonly formSubmit = output<AnnotationFormValue>();
  readonly formCancel = output<void>();

  readonly description = signal('');
  readonly categoryIds = signal<number[]>([]);
  readonly entityIds = signal<number[]>([]);
  readonly files = signal<File[]>([]);
  readonly categoryQuery = signal('');
  readonly brokenCategoryImageIds = signal<Set<number>>(new Set<number>());

  readonly filteredCategories = computed(() => {
    const query = this.categoryQuery().trim().toLowerCase();
    return this.categories().filter((category) =>
      category.status === 'active' && (!query || category.name.toLowerCase().includes(query)),
    );
  });

  submit(): void {
    if (!this.canSubmit()) return;

    this.formSubmit.emit({
      latitude: this.latitude(),
      longitude: this.longitude(),
      description: this.description().trim(),
      categoryIds: this.categoryIds(),
      entityIds: this.entityIds(),
      files: this.files(),
    });
  }

  canSubmit(): boolean {
    return (
      this.description().trim().length >= 3 &&
      this.categoryIds().length > 0 &&
      this.entityIds().length > 0 &&
      !this.saving()
    );
  }

  toggleCategory(categoryId: number): void {
    this.categoryIds.update((ids) =>
      ids.includes(categoryId) ? ids.filter((id) => id !== categoryId) : [...ids, categoryId],
    );
  }

  hasCategoryImage(category: Category): boolean {
    return Boolean(category.image_url) && !this.brokenCategoryImageIds().has(category.id_category);
  }

  resolveCategoryImage(category: Category): string {
    return resolveCategoryImageUrl(category.image_url);
  }

  onCategoryImageError(categoryId: number): void {
    this.brokenCategoryImageIds.update((ids) => new Set(ids).add(categoryId));
  }

  getCategoryIcon(category: Category): string {
    const name = category.name.toLowerCase();

    if (name.includes('seguridad')) return 'solar:shield-bold';
    if (name.includes('infraestructura')) return 'solar:buildings-2-bold';
    if (name.includes('via') || name.includes('tránsito') || name.includes('transito')) return 'solar:streets-map-point-bold';
    if (name.includes('servicio')) return 'solar:plug-bold';
    if (name.includes('ambiente') || name.includes('medio')) return 'solar:leaf-bold';
    if (name.includes('publico') || name.includes('público')) return 'solar:bus-bold';
    if (name.includes('residuo') || name.includes('basura')) return 'solar:trash-bin-trash-bold';
    if (name.includes('salud')) return 'solar:health-bold';
    if (name.includes('educacion') || name.includes('educación')) return 'solar:square-academic-cap-bold';
    if (name.includes('movilidad')) return 'solar:bus-bold';
    if (name.includes('riesgo')) return 'solar:danger-triangle-bold';
    if (name.includes('ruido')) return 'solar:volume-loud-bold';
    if (name.includes('alumbrado')) return 'solar:lightbulb-bold';
    if (name.includes('comercio')) return 'solar:shop-bold';

    return 'solar:menu-dots-circle-bold';
  }

  onEntityChange(event: Event): void {
    const options = Array.from((event.target as HTMLSelectElement).selectedOptions);
    this.entityIds.set(options.map((option) => Number(option.value)));
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(input.files);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.addFiles(event.dataTransfer?.files ?? null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  removeFile(file: File): void {
    this.files.update((files) => files.filter((item) => item !== file));
  }

  cancel(): void {
    this.formCancel.emit();
  }

  private addFiles(fileList: FileList | null): void {
    if (!fileList) return;

    const images = Array.from(fileList).filter((file) => file.type.startsWith('image/'));
    this.files.update((files) => [...files, ...images].slice(0, 5));
  }
}
