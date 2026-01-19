export interface CreateCategoryDto {
  name: string;
  parent_id?: string | null;
}

export interface UpdateCategoryDto {
  name?: string;
}

export interface UpdateSequenceDto {
  updates: Array<{
    id: string;
    sequence: number;
  }>;
}
