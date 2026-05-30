export type ColumnType = 'text' | 'image' | 'badge' | 'html' | 'custom';

export interface BadgeConfig {
  /** El valor que se considera "activo" */
  activeValue: string;
  /** Texto a mostrar cuando está activo (por defecto: activeValue) */
  activeLabel?: string;
  /** Texto a mostrar cuando está inactivo */
  inactiveLabel?: string;
}

export interface TableColumn {
  /** Clave del objeto de datos (soporta dot notation: 'user.name') */
  key: string;
  /** Encabezado visible de la columna */
  label: string;
  /** Tipo de renderizado de la celda */
  type?: ColumnType;
  /** Configuración para columnas tipo 'badge' */
  badgeConfig?: BadgeConfig;
  /** Clases CSS adicionales para la celda (td) */
  cellClass?: string;
  /** Clases CSS adicionales para el encabezado (th) */
  headerClass?: string;
  /** Ancho fijo (ej: '120px', '15%') */
  width?: string;
  /** Deshabilita la columna de acciones para esta fila si es función y retorna true */
  disableSort?: boolean;
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
}

export interface FilterGroup {
  label: string;
  key: string;
  options: FilterOption[];
}

export interface TableAction {
  /** Identificador de la acción */
  id: string;
  /** Ícono SVG o clase de ícono */
  icon: 'edit' | 'delete' | 'view' | 'custom' | 'add';
  customIcon?: string;
  customLabel?: string;
  /** Tooltip */
  tooltip?: string;
  /** Clase CSS del botón */
  buttonClass?: string;
  label?: string;
  /** Función para condicionar visibilidad */
  visible?: (row: any) => boolean;
  /** Función para condicionar habilitación */
  disabled?: (row: any) => boolean;
  isGlobal?: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface TreeConfig {
  /**
   * Clave que identifica de forma única cada nodo.
   * Por defecto: 'id'
   */
  idKey?: string;
  /**
   * Clave que contiene el array de hijos del nodo.
   * Por defecto: 'children'
   */
  childrenKey?: string;
  /**
   * Etiqueta para el badge del nodo raíz (padre).
   * Por defecto: 'Padre'
   */
  rootBadgeLabel?: string;
  /**
   * Etiqueta para el badge del nodo hijo.
   * Por defecto: 'Hijo'
   */
  childBadgeLabel?: string;
  /**
   * Mostrar la columna de tipo (padre/hijo) como badge.
   * Por defecto: true
   */
  showTypeBadge?: boolean;
  /**
   * Texto de la columna de tipo.
   * Por defecto: 'Tipo'
   */
  typeBadgeColumnLabel?: string;
  /**
   * Mostrar columna con el nombre del padre.
   * Por defecto: false
   */
  showParentColumn?: boolean;
  /**
   * Encabezado de la columna padre.
   * Por defecto: 'Padre'
   */
  parentColumnLabel?: string;
  /**
   * Clave del objeto para obtener el nombre del nodo (usado en columna padre).
   * Por defecto: 'name'
   */
  nameKey?: string;
  /**
   * Acción especial para agregar un hijo desde la fila del padre.
   * Si se define, aparece como botón adicional solo en filas padre.
   */
  addChildAction?: {
    id: string;
    tooltip?: string;
    icon?: string;
  };
  /**
   * IDs de nodos expandidos por defecto.
   * Si es null/undefined, todos los nodos raíz se expanden.
   */
  initialExpandedIds?: (string | number)[];
}

/** Fila interna usada por la tabla en modo árbol */
export interface TreeRow {
  /** Datos originales del nodo */
  data: any;
  /** Nivel de profundidad: 0 = raíz, 1 = hijo */
  depth: number;
  /** ID único del nodo */
  id: string | number;
  /** ID del padre (null si es raíz) */
  parentId: string | number | null;
  /** Tiene hijos */
  hasChildren: boolean;
  /** Está expandido */
  expanded: boolean;
  /** Nombre del padre (para columna padre) */
  parentName: string;
}