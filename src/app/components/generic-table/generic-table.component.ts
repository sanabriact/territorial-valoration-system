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
  OnChanges,
  SimpleChanges,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TableColumn,
  FilterGroup,
  TableAction,
  PaginationInfo,
  TreeConfig,
  TreeRow,
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
  
  /**
   * Configuración del modo árbol (opcional).
   * Cuando se provee, la tabla renderiza datos jerárquicos con
   * soporte de expand/collapse por nodo raíz.
   * No afecta el comportamiento normal cuando es undefined/null.
   */
  treeConfig = input<TreeConfig | null | undefined>(undefined);

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
  
  /** IDs de nodos expandidos en modo árbol */
  private expandedIds = signal<Set<string | number>>(new Set());
  
  readonly filterDropdownRef = viewChild<ElementRef<HTMLDivElement>>('filterDropdown');

  constructor() {
    // Cuando cambian los datos en modo árbol, inicializar expanded IDs
    effect(() => {
      const cfg = this.treeConfig();
      const data = this.data();
      if (!cfg || !data.length) return;
      
      const initial = cfg.initialExpandedIds;
      if (initial !== undefined && initial !== null) {
        this.expandedIds.set(new Set(initial));
      } else {
        // Por defecto expandir todos los nodos raíz
        const idKey = cfg.idKey ?? 'id';
        const childrenKey = cfg.childrenKey ?? 'children';
        const rootIds = data
          .filter(item => Array.isArray(item[childrenKey]) || item[childrenKey]?.length > 0)
          .map(item => item[idKey]);
        this.expandedIds.set(new Set(rootIds));
      }
    });
  }

  // ──────────────────────────────────────────────
  // Computed
  // ──────────────────────────────────────────────
  
  /** ¿Está activo el modo árbol? */
  isTreeMode = computed(() => !!this.treeConfig());
  
  /** Filtra la acción configurada para ir en la barra superior (ej: 'create') */
  topbarAction = computed(() => this.actions().find(a => a.isGlobal));
  
  /** Filtra las acciones tradicionales que se renderizan dentro de cada fila */
  rowActions = computed(() => this.actions().filter(a => !a.isGlobal));
  
  // Computed: slice de datos para la página actual (paginación local) — solo modo normal
  pagedData = computed(() => {
    if (this.isTreeMode()) return [];
    const { currentPage, itemsPerPage } = this.pagination();
    const start = (currentPage - 1) * itemsPerPage;
    return this.data().slice(start, start + itemsPerPage);
  });
  
  /** Filas aplanadas del árbol para renderizar en modo árbol */
  treeRows = computed((): TreeRow[] => {
    const cfg = this.treeConfig();
    if (!cfg) return [];
    
    const idKey = cfg.idKey ?? 'id';
    const childrenKey = cfg.childrenKey ?? 'children';
    const nameKey = cfg.nameKey ?? 'name';
    const expanded = this.expandedIds();
    const rows: TreeRow[] = [];
    
    for (const item of this.data()) {
      const nodeId = item[idKey];
      const children: any[] = item[childrenKey] ?? [];
      const hasChildren = children.length > 0;
      const isExpanded = expanded.has(nodeId);
      
      rows.push({
        data: item,
        depth: 0,
        id: nodeId,
        parentId: null,
        hasChildren,
        expanded: isExpanded,
        parentName: '',
      });
      
      if (isExpanded && hasChildren) {
        for (const child of children) {
          rows.push({
            data: child,
            depth: 1,
            id: child[idKey],
            parentId: nodeId,
            hasChildren: false,
            expanded: false,
            parentName: item[nameKey] ?? '',
          });
        }
      }
    }
    return rows;
  });
  
  // Computed: total real basado en los datos recibidos
  effectivePagination = computed(() => {
    const p = this.pagination();
    if (this.isTreeMode()) {
      return { ...p, totalItems: this.treeRows().length };
    }
    return {
      ...p,
      totalItems: p.totalItems > 0 ? p.totalItems : this.data().length,
    };
  });
  
  paginationLabel = computed(() => {
    if (this.isTreeMode()) {
      const total = this.treeRows().length;
      return total === 0
        ? 'Sin resultados'
        : `Mostrando 1 a ${total} de ${total} ${this.pluralize(total)}`;
    }
    const { currentPage, itemsPerPage, totalItems } = this.effectivePagination();
    if (totalItems === 0) return 'Sin resultados';
    const from = (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalItems);
    return `Mostrando ${from} a ${to} de ${totalItems} ${this.pluralize(totalItems)}`;
  });
  
  hasPreviousPage = computed(() => this.effectivePagination().currentPage > 1);
  
  hasNextPage = computed(() => {
    if (this.isTreeMode()) return false;
    const { currentPage, itemsPerPage, totalItems } = this.effectivePagination();
    return currentPage * itemsPerPage < totalItems;
  });
  
  totalPages = computed(() => {
    const { itemsPerPage, totalItems } = this.effectivePagination();
    return Math.ceil(totalItems / itemsPerPage);
  });
  
  activeFiltersCount = computed(() => Object.keys(this.activeFilters()).length);
  
  /** Configuración del árbol con valores por defecto aplicados */
  resolvedTreeConfig = computed(() => {
    const cfg = this.treeConfig();
    if (!cfg) return null;
    return {
      idKey: cfg.idKey ?? 'id',
      childrenKey: cfg.childrenKey ?? 'children',
      rootBadgeLabel: cfg.rootBadgeLabel ?? 'Padre',
      childBadgeLabel: cfg.childBadgeLabel ?? 'Hijo',
      showTypeBadge: cfg.showTypeBadge !== false,
      typeBadgeColumnLabel: cfg.typeBadgeColumnLabel ?? 'Tipo',
      showParentColumn: cfg.showParentColumn ?? false,
      parentColumnLabel: cfg.parentColumnLabel ?? 'Padre',
      nameKey: cfg.nameKey ?? 'name',
      addChildAction: cfg.addChildAction ?? null,
    };
  });
  
  /**
   * Mapéa la imagen rota por un placeholder local si el backend no responde con un archivo válido
   */
  replaceBrokenImage(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const fallbackSrc = 'imagen_por_defecto.png';
    if (!imgElement.src.includes(fallbackSrc)) {
      imgElement.src = fallbackSrc;
    } else {
      imgElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  }

  // ──────────────────────────────────────────────
  // Tree mode methods
  // ──────────────────────────────────────────────
  
  toggleTreeNode(nodeId: string | number): void {
    this.expandedIds.update(current => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }
  
  isNodeExpanded(nodeId: string | number): boolean {
    return this.expandedIds().has(nodeId);
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
    return count === 1 ? 'registro' : 'registros';
  }
  
  trackByIndex(index: number): number {
    return index;
  }
  
  trackByTreeRow(index: number, row: TreeRow): string | number {
    return `${row.depth}-${row.id}`;
  }
}