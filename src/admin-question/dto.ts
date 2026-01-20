export interface CreateQuestionDto {
  title: string;
  category_id: string;
  sub_category_id: string;
  cluster?: string | null;
}

export interface UpdateQuestionDto {
  title?: string;
  category_id?: string;
  sub_category_id?: string;
  cluster?: string | null;
}

export interface QueryQuestionDto {
  categoryId?: string;
  page?: number | string;
  pageSize?: number | string;
}
