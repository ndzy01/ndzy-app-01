import * as SQLite from 'expo-sqlite';

// 数据库名称
const DATABASE_NAME = 'todos.db';

// 获取数据库实例
export const getDatabase = async () => {
  return await SQLite.openDatabaseAsync(DATABASE_NAME);
};

// 初始化数据库表
export const initializeDatabase = async () => {
  try {
    const db = await getDatabase();
    
    // 创建todos表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建索引提高查询性能
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
      CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
    `);

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 清空数据库（开发调试用）
export const clearDatabase = async () => {
  try {
    const db = await getDatabase();
    await db.execAsync('DELETE FROM todos;');
    console.log('Database cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to clear database:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};