import { Category } from "../../Category";

export interface CategoryPagedResponse {
  data: Category[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}