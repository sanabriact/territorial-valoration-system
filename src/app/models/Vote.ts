export interface Vote {
  id_vote: number;
  id_citizen: number;
  id_annotation: number;
  stars: number;
  comment: string;
}

export interface VoteRequest {
  id_citizen: number;
  id_annotation: number;
  stars: number;
  comment: string;
}
