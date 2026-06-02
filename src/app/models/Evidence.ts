export interface Evidence {
  id_evidence: number;
  id_annotation: number;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at?: string;
  updated_at?: string;
}

export interface EvidenceRequest {
  id_annotation: number;
  file_url: string;
  file_type: string;
  file_size: number;
  file?: File | null;
}
