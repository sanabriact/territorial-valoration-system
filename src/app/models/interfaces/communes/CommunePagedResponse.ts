import { Commune } from "../../Commune";

export interface CommunePagedResponse {
  data: Commune[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
