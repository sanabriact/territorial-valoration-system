export interface Vote {
  id_vote: number;
  id_citizen: number;
  id_annotation: number;
  stars: number;
  comment: string;
  created_at?: string;
  updated_at?: string;
}

export interface VoteRequest {
  id_citizen: number;
  id_annotation: number;
  stars: number;
  comment: string;
}
