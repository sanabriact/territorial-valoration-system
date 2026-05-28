import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TableColumn,
  FilterGroup,
  TableAction,
  PaginationInfo,
} from '../../models/components/generic-table/generic-table-types';

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GenericTableComponent {
  /** Definición de columnas a mostrar */
  columns = input.required<TableColumn[]>();

  /** Array de datos a renderizar */
  data = input<any[]>([]);

  /** Input sobre el tipo de información que se va a mostrar usando la componente */
  cardTitle = input<string>('');
  cardSubtitle = input<string>('');

  /** Información de paginación */
  pagination = input<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });

  /** Acciones de la columna de acciones (por defecto: editar y eliminar) */
  actions = input<TableAction[]>([
    { id: 'create', icon: 'add', label: 'Nuevo', isGlobal: true },
    { id: 'edit', icon: 'edit', tooltip: 'Editar' },
    { id: 'delete', icon: 'delete', tooltip: 'Eliminar' },
  ]);

  /** Mostrar columna de acciones */
  showActions = input<boolean>(true);

  /** Grupos de filtros para el dropdown */
  filterGroups = input<FilterGroup[]>([]);

  /** Mostrar botón y dropdown de filtros */
  showFilters = input<boolean>(true);

  /** Placeholder de la barra de búsqueda */
  searchPlaceholder = input<string>('Buscar por nombre...');

  /** Estado de carga */
  loading = input<boolean>(false);

  /** Mensaje cuando no hay datos */
  emptyMessage = input<string>('No se encontraron registros.');

  // ──────────────────────────────────────────────
  // Outputs
  // ──────────────────────────────────────────────

  /** Clic en "Nueva entidad" */
  actionClicked = output<{ actionId: string; row: any }>();

  /** Búsqueda con el texto ingresado */
  searchChanged = output<string>();

  /** Filtros aplicados: mapa clave → valor */
  filtersApplied = output<Record<string, string | number | boolean>>();

  /** Cambio de página */
  pageChanged = output<number>();

  // ──────────────────────────────────────────────
  // Internal state (signals)
  // ──────────────────────────────────────────────

  searchQuery = signal('');
  filterDropdownOpen = signal(false);
  activeFilters = signal<Record<string, string | number | boolean>>({});

  readonly filterDropdownRef =
    viewChild<ElementRef<HTMLDivElement>>('filterDropdown');

  // ──────────────────────────────────────────────
  // Computed
  // ──────────────────────────────────────────────

  /** Filtra la acción configurada para ir en la barra superior (ej: 'create') */
  topbarAction = computed(() => this.actions().find(a => a.isGlobal));

  /** Filtra las acciones tradicionales que se renderizan dentro de cada fila */
  rowActions = computed(() => this.actions().filter(a => !a.isGlobal));

  // Computed: slice de datos para la página actual (paginación local)
  pagedData = computed(() => {
    const { currentPage, itemsPerPage } = this.pagination();
    const start = (currentPage - 1) * itemsPerPage;
    return this.data().slice(start, start + itemsPerPage);
  });

  // Computed: total real basado en los datos recibidos
  // (sobreescribe el totalItems si viene en 0 desde afuera)
  effectivePagination = computed(() => {
    const p = this.pagination();
    return {
      ...p,
      totalItems: p.totalItems > 0 ? p.totalItems : this.data().length,
    };
  });

  paginationLabel = computed(() => {
    const { currentPage, itemsPerPage, totalItems } = this.effectivePagination();
    if (totalItems === 0) return 'Sin resultados';
    const from = (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalItems);
    return `Mostrando ${from} a ${to} de ${totalItems} ${this.pluralize(totalItems)}`;
  });

  hasPreviousPage = computed(() => this.effectivePagination().currentPage > 1);

  hasNextPage = computed(() => {
    const { currentPage, itemsPerPage, totalItems } = this.effectivePagination();
    return currentPage * itemsPerPage < totalItems;
  });

  totalPages = computed(() => {
    const { itemsPerPage, totalItems } = this.effectivePagination();
    return Math.ceil(totalItems / itemsPerPage);
  });

  activeFiltersCount = computed(() => Object.keys(this.activeFilters()).length);

  /**
   Mapéa la imagen rota por un placeholder local si el backend no responde con un archivo válido
   */
  replaceBrokenImage(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const fallbackSrc = 'imagen_por_defecto.png';

    if (!imgElement.src.includes(fallbackSrc)) {
      imgElement.src = fallbackSrc;
    } else {
      // Si por alguna razón incluso el asset local falla, usamos un pixel transparente en Base64
      // Esto detiene cualquier bucle de eventos (error) de forma definitiva.
      imgElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  }

  // ──────────────────────────────────────────────
  // Event handlers
  // ──────────────────────────────────────────────

  onActionClicked(actionId: string, row: any): void {
    this.actionClicked.emit({ actionId, row });
  }
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchChanged.emit(value);
  }

  toggleFilterDropdown(): void {
    this.filterDropdownOpen.update((v) => !v);
  }

  setFilter(key: string, value: string | number | boolean): void {
    this.activeFilters.update((prev) => ({ ...prev, [key]: value }));
  }

  clearFilter(key: string): void {
    this.activeFilters.update((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  applyFilters(): void {
    this.filtersApplied.emit(this.activeFilters());
    this.filterDropdownOpen.set(false);
  }

  clearAllFilters(): void {
    this.activeFilters.set({});
    this.filtersApplied.emit({});
    this.filterDropdownOpen.set(false);
  }

  goToPreviousPage(): void {
    if (this.hasPreviousPage()) {
      this.pageChanged.emit(this.pagination().currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.hasNextPage()) {
      this.pageChanged.emit(this.pagination().currentPage + 1);
    }
  }

  goToPage(page: number): void {
    this.pageChanged.emit(page);
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  /**
   * Resuelve el valor de una celda soportando dot-notation.
   * Ej: key = 'address.city' → row['address']['city']
   */
  getCellValue(row: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], row);
  }

  isActionVisible(action: TableAction, row: any): boolean {
    return action.visible ? action.visible(row) : true;
  }

  isActionDisabled(action: TableAction, row: any): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  getBadgeActive(row: any, col: TableColumn): boolean {
    if (!col.badgeConfig) return false;
    return (
      String(this.getCellValue(row, col.key)) ===
      String(col.badgeConfig.activeValue)
    );
  }

  getBadgeLabel(row: any, col: TableColumn): string {
    if (!col.badgeConfig) return this.getCellValue(row, col.key);
    const isActive = this.getBadgeActive(row, col);
    return isActive
      ? (col.badgeConfig.activeLabel ?? col.badgeConfig.activeValue)
      : (col.badgeConfig.inactiveLabel ?? String(this.getCellValue(row, col.key)));
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.pagination().currentPage;
    const delta = 2;

    const range: number[] = [];
    for (
      let i = Math.max(1, current - delta);
      i <= Math.min(total, current + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }

  private pluralize(count: number): string {
    // Genérico; se puede sobreescribir con un input si se necesita
    return count === 1 ? 'registro' : 'registros';
  }

  trackByIndex(index: number): number {
    return index;
  }
} 
