// Todo数据类型定义
export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// 创建Todo时的输入类型
export interface CreateTodoInput {
  title: string;
  description: string;
}

// 更新Todo时的输入类型
export interface UpdateTodoInput {
  id: number;
  title?: string;
  description?: string;
  completed?: boolean;
}

// 搜索和筛选选项
export interface TodoFilters {
  searchText?: string;
  completed?: boolean;
  dateFrom?: string;  // YYYY-MM-DD 格式
  dateTo?: string;    // YYYY-MM-DD 格式
}

// 数据库操作返回类型
export interface DatabaseResult {
  success: boolean;
  data?: any;
  error?: string;
}