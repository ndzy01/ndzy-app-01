import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTodoDatabase } from '@/hooks/use-todo-database';
import { Todo } from '@/types/todo';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EditTodoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getTodos, updateTodo } = useTodoDatabase();

  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#333333' }, 'icon');

  // 加载Todo数据
  useEffect(() => {
    const loadTodo = async () => {
      if (!id) {
        Alert.alert('错误', '无效的任务ID');
        router.back();
        return;
      }

      try {
        const result = await getTodos();
        if (result.success && result.data) {
          const targetTodo = result.data.find((t: Todo) => t.id === parseInt(id));
          if (targetTodo) {
            setTodo(targetTodo);
            setTitle(targetTodo.title);
            setDescription(targetTodo.description);
          } else {
            Alert.alert('错误', '未找到该任务');
            router.back();
          }
        }
      } catch (error) {
        Alert.alert('错误', '加载任务失败');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadTodo();
  }, [id, getTodos]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入任务标题');
      return;
    }

    if (!todo) return;

    setIsSubmitting(true);

    try {
      const result = await updateTodo({
        id: todo.id,
        title: title.trim(),
        description: description.trim(),
      });

      if (result.success) {
        router.back();
      } else {
        Alert.alert('错误', result.error || '更新任务失败');
      }
    } catch (error) {
      Alert.alert('错误', '更新任务时发生未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!todo) {
      router.back();
      return;
    }

    const hasChanges = title.trim() !== todo.title || description.trim() !== todo.description;

    if (hasChanges) {
      Alert.alert('确认', '确定要放弃当前修改吗？', [
        { text: '继续编辑', style: 'cancel' },
        { text: '放弃修改', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.loadingText}>加载中...</ThemedText>
      </ThemedView>
    );
  }

  if (!todo) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>任务未找到</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ThemedView style={styles.container}>
        {/* 头部导航 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
            <IconSymbol name="xmark" size={24} color={iconColor} />
          </TouchableOpacity>

          <ThemedText type="title" style={styles.headerTitle}>
            编辑任务
          </ThemedText>

          <TouchableOpacity
            style={[styles.headerButton, (!title.trim() || isSubmitting) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!title.trim() || isSubmitting}
          >
            <ThemedText
              style={[
                styles.submitButtonText,
                { color: tintColor },
                (!title.trim() || isSubmitting) && styles.disabledButtonText,
              ]}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 表单内容 */}
        <View style={styles.form}>
          {/* 任务状态显示 */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <IconSymbol
                name={todo.completed ? 'checkmark.circle.fill' : 'circle'}
                size={20}
                color={todo.completed ? tintColor : iconColor}
              />
              <ThemedText style={styles.statusText}>{todo.completed ? '已完成' : '进行中'}</ThemedText>
            </View>
            <ThemedText style={styles.dateText}>
              创建于 {new Date(todo.created_at).toLocaleDateString('zh-CN')}
            </ThemedText>
          </View>

          {/* 标题输入 */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>任务标题 *</ThemedText>
            <TextInput
              style={[
                styles.titleInput,
                {
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="输入任务标题..."
              placeholderTextColor={iconColor}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              autoFocus
            />
            <ThemedText style={styles.charCount}>{title.length}/100</ThemedText>
          </View>

          {/* 描述输入 */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>任务描述</ThemedText>
            <TextInput
              style={[
                styles.descriptionInput,
                {
                  borderColor,
                  color: textColor,
                },
              ]}
              placeholder="输入任务描述（可选）..."
              placeholderTextColor={iconColor}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <ThemedText style={styles.charCount}>{description.length}/500</ThemedText>
          </View>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.5,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
});
