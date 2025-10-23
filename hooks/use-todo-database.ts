import { getDatabase } from '@/lib/database';
import { CreateTodoInput, DatabaseResult, Todo, TodoFilters, UpdateTodoInput } from '@/types/todo';
import { useCallback, useState } from 'react';

export const useTodoDatabase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 清除错误状态
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 创建新的Todo
  const createTodo = useCallback(async (input: CreateTodoInput): Promise<DatabaseResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      
      const result = await db.runAsync(
        'INSERT INTO todos (title, description, completed, created_at, updated_at) VALUES (?, ?, 0, ?, ?)',
        [input.title, input.description, now, now]
      );

      const newTodo: Todo = {
        id: result.lastInsertRowId,
        title: input.title,
        description: input.description,
        completed: false,
        created_at: now,
        updated_at: now
      };

      setIsLoading(false);
      return { success: true, data: newTodo };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create todo';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 获取所有Todo或根据条件筛选
  const getTodos = useCallback(async (filters?: TodoFilters): Promise<DatabaseResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const db = await getDatabase();
      let query = 'SELECT * FROM todos';
      const params: any[] = [];
      const conditions: string[] = [];

      // 添加筛选条件
      if (filters?.completed !== undefined) {
        conditions.push('completed = ?');
        params.push(filters.completed ? 1 : 0);
      }

      if (filters?.searchText) {
        conditions.push('(title LIKE ? OR description LIKE ?)');
        const searchPattern = `%${filters.searchText}%`;
        params.push(searchPattern, searchPattern);
      }

      // 添加日期范围筛选
      if (filters?.dateFrom) {
        conditions.push('DATE(created_at) >= ?');
        params.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        conditions.push('DATE(created_at) <= ?');
        params.push(filters.dateTo);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const result = await db.getAllAsync(query, params);
      
      // 转换数据类型
      const todos: Todo[] = result.map((row: any) => ({
        ...row,
        completed: Boolean(row.completed)
      }));

      setIsLoading(false);
      return { success: true, data: todos };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch todos';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 更新Todo
  const updateTodo = useCallback(async (input: UpdateTodoInput): Promise<DatabaseResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      
      const updates: string[] = [];
      const params: any[] = [];

      if (input.title !== undefined) {
        updates.push('title = ?');
        params.push(input.title);
      }

      if (input.description !== undefined) {
        updates.push('description = ?');
        params.push(input.description);
      }

      if (input.completed !== undefined) {
        updates.push('completed = ?');
        params.push(input.completed ? 1 : 0);
      }

      updates.push('updated_at = ?');
      params.push(now);

      params.push(input.id);

      const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`;
      
      const result = await db.runAsync(query, params);
      
      if (result.changes === 0) {
        throw new Error('Todo not found');
      }

      // 获取更新后的Todo
      const updatedResult = await db.getFirstAsync('SELECT * FROM todos WHERE id = ?', [input.id]);
      
      if (!updatedResult) {
        throw new Error('Failed to fetch updated todo');
      }

      const updatedTodo: Todo = {
        ...(updatedResult as any),
        completed: Boolean((updatedResult as any).completed)
      } as Todo;

      setIsLoading(false);
      return { success: true, data: updatedTodo };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update todo';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 删除Todo
  const deleteTodo = useCallback(async (id: number): Promise<DatabaseResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const db = await getDatabase();
      const result = await db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
      
      if (result.changes === 0) {
        throw new Error('Todo not found');
      }

      setIsLoading(false);
      return { success: true, data: { deletedId: id } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete todo';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 切换Todo完成状态
  const toggleTodoComplete = useCallback(async (id: number, completed: boolean): Promise<DatabaseResult> => {
    return updateTodo({ id, completed });
  }, [updateTodo]);

  // 获取Todo统计信息
  const getTodoStats = useCallback(async (): Promise<DatabaseResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const db = await getDatabase();
      
      const totalResult = await db.getFirstAsync('SELECT COUNT(*) as total FROM todos');
      const completedResult = await db.getFirstAsync('SELECT COUNT(*) as completed FROM todos WHERE completed = 1');
      const pendingResult = await db.getFirstAsync('SELECT COUNT(*) as pending FROM todos WHERE completed = 0');

      const stats = {
        total: (totalResult as any)?.total || 0,
        completed: (completedResult as any)?.completed || 0,
        pending: (pendingResult as any)?.pending || 0
      };

      setIsLoading(false);
      return { success: true, data: stats };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    // 状态
    isLoading,
    error,
    
    // 操作方法
    createTodo,
    getTodos,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    getTodoStats,
    clearError
  };
};