export type CategoryStatus = 'active' | 'inactive';

export interface Category {
  id_category: number;
  id_parent_category: number | null;
  name: string;
  description: string;
  image_url: string;
  status: CategoryStatus | string;
  file?: File | null;
}

export interface CategoryFormValue {
  id_parent_category: number | null;
  name: string;
  description: string;
  image_url: string;
  status: CategoryStatus;
  file: File | null;
}

export interface CategoryTreeNode extends Category {
  children: Category[];
}
