import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useTodoDatabase } from '@/hooks/use-todo-database';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddTodoModal() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createTodo } = useTodoDatabase();
  
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#333333' }, 'icon');

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle) {
      Alert.alert('错误', '请输入任务标题');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createTodo({
        title: trimmedTitle,
        description: description.trim()
      });

      if (result.success) {
        router.back();
      } else {
        Alert.alert('错误', result.error || '创建任务失败');
      }
    } catch (error) {
      Alert.alert('错误', '创建任务时发生未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim()) {
      Alert.alert(
        '确认',
        '未保存的内容将丢失，确定要返回吗？',
        [
          { text: '继续编辑', style: 'cancel' },
          { text: '确定', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
          >
            <IconSymbol name="xmark" size={24} color={iconColor} />
          </TouchableOpacity>
          
          <ThemedText type="title" style={styles.headerTitle}>
            新建任务
          </ThemedText>

          <TouchableOpacity
            style={[
              styles.headerButton,
              isSubmitting && styles.disabledButton
            ]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <ThemedText style={[
              styles.saveButtonText,
              { color: tintColor },
              isSubmitting && styles.disabledText
            ]}>
              {isSubmitting ? '保存中...' : '保存'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 表单 */}
        <View style={styles.form}>
          {/* 标题输入 */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>标题 *</ThemedText>
            <TextInput
              style={[
                styles.titleInput,
                { color: textColor, borderColor }
              ]}
              placeholder="请输入任务标题..."
              placeholderTextColor={iconColor}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              autoFocus
            />
            <ThemedText style={styles.characterCount}>
              {title.length}/100
            </ThemedText>
          </View>

          {/* 描述输入 */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>描述</ThemedText>
            <TextInput
              style={[
                styles.descriptionInput,
                { color: textColor, borderColor }
              ]}
              placeholder="请输入任务描述..."
              placeholderTextColor={iconColor}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <ThemedText style={styles.characterCount}>
              {description.length}/500
            </ThemedText>
          </View>

          {/* 提示信息 */}
          <View style={styles.tipContainer}>
            <IconSymbol name="lightbulb" size={16} color={iconColor} />
            <ThemedText style={styles.tipText}>
              填写清晰的标题有助于更好地管理你的任务
            </ThemedText>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
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
    minHeight: 48,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
    marginTop: 4,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    opacity: 0.8,
    marginLeft: 8,
    lineHeight: 18,
  },
});