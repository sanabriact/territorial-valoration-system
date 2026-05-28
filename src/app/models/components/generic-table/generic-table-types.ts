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
