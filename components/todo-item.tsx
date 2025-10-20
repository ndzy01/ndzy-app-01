import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Todo } from '@/types/todo';
import { router } from 'expo-router';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

export function TodoItem({ todo, onToggleComplete, onDelete }: TodoItemProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#333333' }, 'icon');

  const handleToggleComplete = () => {
    onToggleComplete(todo.id, !todo.completed);
  };

  const handleDelete = () => {
    Alert.alert(
      '删除确认',
      '确定要删除这个任务吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => onDelete(todo.id)
        }
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/edit-todo/${todo.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ThemedView style={[styles.container, { borderColor }]}>
      {/* 左侧完成状态按钮 */}
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={handleToggleComplete}
      >
        <IconSymbol
          name={todo.completed ? 'checkmark.circle.fill' : 'circle'}
          size={24}
          color={todo.completed ? tintColor : iconColor}
        />
      </TouchableOpacity>

      {/* 中间内容区域 */}
      <View style={styles.contentContainer}>
        <ThemedText 
          style={[
            styles.title,
            todo.completed && styles.completedText
          ]}
          numberOfLines={1}
        >
          {todo.title}
        </ThemedText>
        
        {todo.description ? (
          <ThemedText 
            style={[
              styles.description,
              todo.completed && styles.completedText
            ]}
            numberOfLines={2}
          >
            {todo.description}
          </ThemedText>
        ) : null}
        
        <ThemedText style={styles.dateText}>
          {formatDate(todo.created_at)}
        </ThemedText>
      </View>

      {/* 右侧操作按钮 */}
      <View style={styles.actionsContainer}>
        {/* 编辑按钮 */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleEdit}
        >
          <IconSymbol
            name="pencil"
            size={20}
            color={iconColor}
          />
        </TouchableOpacity>

        {/* 删除按钮 */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDelete}
        >
          <IconSymbol
            name="trash"
            size={20}
            color={iconColor}
          />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
});