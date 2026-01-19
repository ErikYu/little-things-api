export interface CreateQuestionDto {
  title: string;
  category_id: string;
  sequence: number;
  cluster?: string | null;
}

export interface UpdateQuestionDto {
  title?: string;
  category_id?: string;
  sequence?: number;
  cluster?: string | null;
}

export interface QueryQuestionDto {
  categoryId?: string;
  page?: number | string;
  pageSize?: number | string;
}
