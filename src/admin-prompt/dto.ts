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

export interface CreatePromptTestDto {
  test_input: string; // 测试用的reflection文本
  test_note?: string; // 可选的测试备注
}
