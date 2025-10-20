import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TodoItem } from '@/components/todo-item';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useDebounce } from '@/hooks/use-debounce';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTodoDatabase } from '@/hooks/use-todo-database';
import { initializeDatabase } from '@/lib/database';
import { Todo, TodoFilters } from '@/types/todo';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterCompleted, setFilterCompleted] = useState<boolean | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  // 使用防抖Hook优化搜索
  const debouncedSearchText = useDebounce(searchText, 300);

  const { isLoading, error, getTodos, deleteTodo, toggleTodoComplete, clearError } = useTodoDatabase();

  const insets = useSafeAreaInsets();

  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#333333' }, 'icon');
  const textColor = useThemeColor({}, 'text');

  // 初始化数据库
  useEffect(() => {
    const initDB = async () => {
      try {
        await initializeDatabase();
        setIsInitialized(true);
        await loadTodos();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        Alert.alert('错误', '数据库初始化失败');
      }
    };

    initDB();
  }, []);

  // 加载todos
  const loadTodos = useCallback(async () => {
    if (!isInitialized) return;

    const filters: TodoFilters = {};
    if (debouncedSearchText.trim()) {
      filters.searchText = debouncedSearchText.trim();
    }
    if (filterCompleted !== undefined) {
      filters.completed = filterCompleted;
    }

    const result = await getTodos(filters);
    if (result.success && result.data) {
      setTodos(result.data);
    }
  }, [getTodos, debouncedSearchText, filterCompleted, isInitialized]);

  // 监听防抖后的搜索文本和筛选条件变化
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // 当页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      if (isInitialized) {
        loadTodos();
      }
    }, [loadTodos, isInitialized]),
  );

  // 处理创建新todo
  const handleCreateTodo = () => {
    router.push('/add-todo');
  };

  // 处理切换完成状态
  const handleToggleComplete = async (id: number, completed: boolean) => {
    const result = await toggleTodoComplete(id, completed);
    if (result.success) {
      await loadTodos();
    } else {
      Alert.alert('错误', result.error || '更新任务状态失败');
    }
  };

  // 处理删除todo
  const handleDeleteTodo = async (id: number) => {
    const result = await deleteTodo(id);
    if (result.success) {
      await loadTodos();
    } else {
      Alert.alert('错误', result.error || '删除任务失败');
    }
  };

  // 渲染筛选按钮
  const renderFilterButton = (title: string, isActive: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.filterButton, { borderColor }, isActive && { backgroundColor: tintColor }]}
      onPress={onPress}
    >
      <ThemedText style={[styles.filterButtonText, isActive && { color: '#fff' }]}>{title}</ThemedText>
    </TouchableOpacity>
  );

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="list.bullet" size={64} color={iconColor} style={styles.emptyIcon} />
      <ThemedText style={styles.emptyTitle}>
        {searchText.trim() || filterCompleted !== undefined ? '没有找到匹配的任务' : '还没有任务'}
      </ThemedText>
      <ThemedText style={styles.emptyDescription}>
        {searchText.trim() || filterCompleted !== undefined
          ? '尝试调整搜索条件或筛选器'
          : '点击下方的 + 按钮创建你的第一个任务'}
      </ThemedText>
    </View>
  );

  if (!isInitialized) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.loadingText}>正在初始化...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* 头部区域 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ThemedText type="title" style={styles.title}>
          我的任务
        </ThemedText>

        {/* 搜索框 */}
        <View style={[styles.searchContainer, { borderColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={iconColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="搜索任务..."
            placeholderTextColor={iconColor}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={iconColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* 筛选按钮 */}
        <View style={styles.filterContainer}>
          {renderFilterButton('全部', filterCompleted === undefined, () => setFilterCompleted(undefined))}
          {renderFilterButton('进行中', filterCompleted === false, () => setFilterCompleted(false))}
          {renderFilterButton('已完成', filterCompleted === true, () => setFilterCompleted(true))}
        </View>
      </View>

      {/* 错误提示 */}
      {error && (
        <View style={[styles.errorContainer, { borderColor: '#FF3B30' }]}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={clearError}>
            <IconSymbol name="xmark" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}

      {/* 任务列表 */}
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TodoItem todo={item} onToggleComplete={handleToggleComplete} onDelete={handleDeleteTodo} />
        )}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={loadTodos}
      />

      {/* 创建按钮 */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: tintColor }]} onPress={handleCreateTodo}>
        <IconSymbol name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B3020',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
