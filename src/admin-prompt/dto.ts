import { PromptCategory } from '@prisma/client';

export interface CreatePromptDto {
  category: PromptCategory;
  content: string;
  active: boolean;
  change_note?: string;
}

export interface UpdatePromptDto {
  content?: string;
  active?: boolean;
  change_note?: string;
}

export interface QueryPromptDto {
  category?: PromptCategory;
  content?: string; // 模糊查询
  active?: boolean;
  page?: number;
  pageSize?: number;
}

