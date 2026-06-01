import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../../../models/Category';
import { Entity } from '../../../../../models/Entity';
import { AnnotationFormValue } from '../../models/annotation-map.model';

@Component({
  selector: 'app-annotation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annotation-form.component.html',
  styleUrl: './annotation-form.component.scss',
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
