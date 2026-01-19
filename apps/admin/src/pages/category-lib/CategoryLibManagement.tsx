import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import {
  Box,
  TextField,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Fab,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategoryTree {
  id: string;
  name: string;
  sequence: number;
  parent_id: string | null;
  children: CategoryTree[];
}

function SortableSubCategoryItem({
  subCategory,
  editingId,
  editingName,
  onStartEdit,
  onNameChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  deletingId,
}: {
  subCategory: CategoryTree;
  editingId: string | null;
  editingName: string;
  onStartEdit: (id: string, name: string) => void;
  onNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subCategory.id });

  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingId === subCategory.id;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDoubleClick = () => {
    if (!isEditing) {
      onStartEdit(subCategory.id, subCategory.name);
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      const trimmedName = editingName.trim();
      if (trimmedName && trimmedName !== subCategory.name) {
        onSaveEdit();
      } else {
        onCancelEdit();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedName = editingName.trim();
      if (trimmedName && trimmedName !== subCategory.name) {
        onSaveEdit();
      } else {
        onCancelEdit();
      }
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        mb: 1,
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorIcon color="action" fontSize="small" />
      </Box>
      {isEditing ? (
        <TextField
          inputRef={inputRef}
          size="small"
          value={editingName}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Sub-category name"
          sx={{ flex: 1 }}
        />
      ) : (
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            cursor: 'text',
            userSelect: 'none',
          }}
          onDoubleClick={handleDoubleClick}
        >
          {subCategory.name}
        </Typography>
      )}
      {!isEditing && (
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(subCategory.id)}
          disabled={deletingId === subCategory.id}
          sx={{ p: 0.5 }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

function SortableCategoryCard({
  category,
  editingId,
  editingName,
  onStartEdit,
  onNameChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  deletingId,
  onSubCategoryDragEnd,
  sensors,
  creatingParentId,
  creatingName,
  onStartCreate,
  onCreateNameChange,
  onCreateSave,
  onCreateCancel,
  saving,
}: {
  category: CategoryTree;
  editingId: string | null;
  editingName: string;
  onStartEdit: (id: string, name: string) => void;
  onNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  onSubCategoryDragEnd: (event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
  creatingParentId: string | 'root' | null;
  creatingName: string;
  onStartCreate: (parentId: string) => void;
  onCreateNameChange: (name: string) => void;
  onCreateSave: () => void;
  onCreateCancel: () => void;
  saving: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingId === category.id;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleDoubleClick = () => {
    if (!isEditing) {
      onStartEdit(category.id, category.name);
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      const trimmedName = editingName.trim();
      if (trimmedName && trimmedName !== category.name) {
        onSaveEdit();
      } else {
        onCancelEdit();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedName = editingName.trim();
      if (trimmedName && trimmedName !== category.name) {
        onSaveEdit();
      } else {
        onCancelEdit();
      }
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        cursor: isDragging ? 'grabbing' : 'grab',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <DragIndicatorIcon color="action" />
          </Box>
          {isEditing ? (
            <TextField
              inputRef={inputRef}
              size="small"
              value={editingName}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Category name"
              sx={{ flex: 1 }}
            />
          ) : (
            <Typography
              variant="h6"
              sx={{
                flex: 1,
                cursor: 'text',
                userSelect: 'none',
                fontWeight: 500,
              }}
              onDoubleClick={handleDoubleClick}
            >
              {category.name}
            </Typography>
          )}
          {!isEditing && category.children.length === 0 && (
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(category.id)}
              disabled={deletingId === category.id}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {/* Sub-categories section - always visible */}
        <Box sx={{ mt: category.children.length > 0 ? 0 : 1 }}>
          {category.children.length > 0 && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
              >
                Sub-categories:
              </Typography>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onSubCategoryDragEnd}
              >
                <SortableContext
                  items={category.children.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {category.children.map((child) => (
                    <SortableSubCategoryItem
                      key={child.id}
                      subCategory={child}
                      editingId={editingId}
                      editingName={editingName}
                      onStartEdit={onStartEdit}
                      onNameChange={onNameChange}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                      onDelete={onDelete}
                      deletingId={deletingId}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          )}

          {/* Creating sub-category inline */}
          {creatingParentId === category.id && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                mb: 1,
              }}
            >
              <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                <DragIndicatorIcon color="disabled" />
              </Box>
              <TextField
                autoFocus
                size="small"
                value={creatingName}
                onChange={(e) => onCreateNameChange(e.target.value)}
                onBlur={onCreateSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onCreateSave();
                  } else if (e.key === 'Escape') {
                    onCreateCancel();
                  }
                }}
                placeholder="New sub-category name"
                sx={{ flex: 1 }}
                disabled={saving}
              />
            </Box>
          )}

          {/* Add Sub-category button */}
          {creatingParentId !== category.id && (
            <Box
              onClick={() => onStartCreate(category.id)}
              sx={{
                mt: 1,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                color: 'text.disabled',
                transition: 'all 0.2s',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                <AddIcon fontSize="small" />
              </Box>
              <Typography variant="body2">Add Sub-category</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function CategoryLibManagement() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  // null = not creating, 'root' = creating top-level, string = creating sub-category under parent ID
  const [creatingParentId, setCreatingParentId] = useState<string | 'root' | null>(null);
  const [creatingName, setCreatingName] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [isAddCategoryVisible, setIsAddCategoryVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback ref to set up Intersection Observer when element is mounted
  const addCategoryRef = (node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setIsAddCategoryVisible(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
  };

  const handleScrollToAdd = () => {
    const addCategoryElement = document.getElementById('add-category-area');
    addCategoryElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // activationConstraint: {
      //   distance: 8, // 移动 8px 后才开始拖拽，避免误触
      // },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data: CategoryTree[] = await api.get('/admin-category');
      setCategories(data);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch categories',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const findCategoryInTree = (
    cats: CategoryTree[],
    id: string,
    parent: CategoryTree | null = null,
  ): { category: CategoryTree; parent: CategoryTree | null } | null => {
    for (const cat of cats) {
      if (cat.id === id) {
        return { category: cat, parent };
      }
      const found = findCategoryInTree(cat.children, id, cat);
      if (found) {
        return found;
      }
    }
    return null;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeResult = findCategoryInTree(categories, active.id as string);
    let overResult = findCategoryInTree(categories, over.id as string);

    if (!activeResult || !overResult) return;

    // 如果拖拽的是顶级分类，但 over 是子分类，则找到子分类的父分类
    // 这样可以实现拖拽顶级分类到另一个顶级分类的位置（即使鼠标在子分类区域）
    if (!activeResult.parent && overResult.parent) {
      // 拖拽顶级分类到子分类区域，应该拖拽到该子分类的父分类位置
      const parentResult = findCategoryInTree(
        categories,
        overResult.parent.id,
      );
      if (parentResult) {
        overResult = parentResult;
      } else {
        // 如果找不到父分类，说明逻辑有问题，直接返回
        return;
      }
    }

    // 确定 active 和 over 的父级 ID（null 表示顶级分类）
    const activeParentId = activeResult.parent?.id ?? null;
    const overParentId = overResult.parent?.id ?? null;

    // 只能在同一级别内拖拽
    if (activeParentId !== overParentId) {
      return;
    }

    // 获取同级的所有项
    const siblings = activeResult.parent
      ? activeResult.parent.children
      : categories;

    const oldIndex = siblings.findIndex((c) => c.id === active.id);
    const newIndex = siblings.findIndex((c) => c.id === overResult.category.id);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const newSiblings = arrayMove(siblings, oldIndex, newIndex);
    // 更新sequence
    const updates = newSiblings.map((cat, index) => ({
      id: cat.id,
      sequence: index + 1,
    }));

    // 乐观更新
    const updateCategories = (cats: CategoryTree[]): CategoryTree[] => {
      if (activeResult.parent) {
        // 更新子分类
        return cats.map((cat) => {
          if (cat.id === activeResult.parent!.id) {
            return {
              ...cat,
              children: newSiblings.map((child, idx) => ({
                ...child,
                sequence: idx + 1,
              })),
            };
          }
          return {
            ...cat,
            children: cat.children, // 保持子分类不变
          };
        });
      } else {
        // 更新顶级分类
        return newSiblings.map((cat, idx) => ({
          ...cat,
          sequence: idx + 1,
          children: cat.children, // 直接使用子分类，不递归调用，避免无限递归
        }));
      }
    };

    const updatedCategories = updateCategories(categories);
    setCategories(updatedCategories);

    // 立即保存
    setSaving(true);
    try {
      await api.put('/admin-category/sequence', { updates });
      showSnackbar('Order updated successfully', 'success');
    } catch (err: any) {
      // 回滚
      fetchCategories();
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to update order',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeResult = findCategoryInTree(categories, active.id as string);
    const overResult = findCategoryInTree(categories, over.id as string);

    if (!activeResult || !overResult) return;

    // 确保都是子分类且属于同一个父分类
    if (!activeResult.parent || !overResult.parent) return;
    if (activeResult.parent.id !== overResult.parent.id) return;

    // 获取同级的所有子分类
    const siblings = activeResult.parent.children;

    const oldIndex = siblings.findIndex((c) => c.id === active.id);
    const newIndex = siblings.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const newSiblings = arrayMove(siblings, oldIndex, newIndex);
    // 更新sequence
    const updates = newSiblings.map((cat, index) => ({
      id: cat.id,
      sequence: index + 1,
    }));

    // 乐观更新
    const updateCategories = (cats: CategoryTree[]): CategoryTree[] => {
      return cats.map((cat) => {
        if (cat.id === activeResult.parent!.id) {
          return {
            ...cat,
            children: newSiblings.map((child, idx) => ({
              ...child,
              sequence: idx + 1,
            })),
          };
        }
        return {
          ...cat,
          children: updateCategories(cat.children),
        };
      });
    };

    setCategories(updateCategories(categories));

    // 立即保存
    setSaving(true);
    try {
      await api.put('/admin-category/sequence', { updates });
      showSnackbar('Sub-category order updated successfully', 'success');
    } catch (err: any) {
      // 回滚
      fetchCategories();
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to update sub-category order',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleNameChange = (name: string) => {
    setEditingName(name);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const trimmedName = editingName.trim();
    if (!trimmedName) {
      showSnackbar('Category name cannot be empty', 'error');
      setEditingId(null);
      setEditingName('');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/admin-category/${editingId}`, { name: trimmedName });
      showSnackbar('Category updated successfully', 'success');
      setEditingId(null);
      setEditingName('');
      await fetchCategories();
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to update category',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setDeleteDialogOpen(false);
    setDeletingId(categoryToDelete);
    try {
      await api.delete(`/admin-category/${categoryToDelete}`);
      showSnackbar('Category deleted successfully', 'success');
      await fetchCategories();
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to delete category',
        'error',
      );
    } finally {
      setDeletingId(null);
      setCategoryToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleStartCreate = (parentId: string | 'root') => {
    setCreatingParentId(parentId);
    setCreatingName('');
  };

  const handleCreateSave = async () => {
    const trimmedName = creatingName.trim();
    if (!trimmedName) {
      handleCreateCancel();
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin-category', {
        name: trimmedName,
        parent_id: creatingParentId === 'root' ? null : creatingParentId,
      });
      showSnackbar('Category created successfully', 'success');
      await fetchCategories();
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to create category',
        'error',
      );
    } finally {
      setSaving(false);
      setCreatingParentId(null);
      setCreatingName('');
    }
  };

  const handleCreateCancel = () => {
    setCreatingParentId(null);
    setCreatingName('');
  };

  const findCategoryName = (id: string): string | null => {
    const findCategory = (cats: CategoryTree[], targetId: string): CategoryTree | null => {
      for (const cat of cats) {
        if (cat.id === targetId) return cat;
        const found = findCategory(cat.children, targetId);
        if (found) return found;
      }
      return null;
    };
    const category = findCategory(categories, id);
    return category ? category.name : null;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          Category Library
        </Typography>
        {saving && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Saving...
            </Typography>
          </Box>
        )}
      </Box>

      <Box>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={2}>
              {categories.map((category) => (
                <SortableCategoryCard
                  key={category.id}
                  category={category}
                  editingId={editingId}
                  editingName={editingName}
                  onStartEdit={handleStartEdit}
                  onNameChange={handleNameChange}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onDelete={handleDeleteClick}
                  deletingId={deletingId}
                  onSubCategoryDragEnd={handleSubCategoryDragEnd}
                  sensors={sensors}
                  creatingParentId={creatingParentId}
                  creatingName={creatingName}
                  onStartCreate={handleStartCreate}
                  onCreateNameChange={setCreatingName}
                  onCreateSave={handleCreateSave}
                  onCreateCancel={handleCreateCancel}
                  saving={saving}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>

        {/* Add Category placeholder */}
        <Box id="add-category-area" ref={addCategoryRef}>
          {creatingParentId === 'root' ? (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 24 }} /> {/* Placeholder for drag handle */}
                  <TextField
                    autoFocus
                    size="small"
                    value={creatingName}
                    onChange={(e) => setCreatingName(e.target.value)}
                    onBlur={handleCreateSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateSave();
                      } else if (e.key === 'Escape') {
                        handleCreateCancel();
                      }
                    }}
                    placeholder="New category name"
                    sx={{ flex: 1 }}
                    disabled={saving}
                  />
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Box
              onClick={() => handleStartCreate('root')}
              sx={{
                mt: 2,
                p: 2,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                cursor: 'pointer',
                color: 'text.secondary',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <AddIcon fontSize="small" />
              <Typography variant="body2">Add Category</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* FAB to scroll to add category - hidden when add area is visible */}
      {!isAddCategoryVisible && (
        <Fab
          color="primary"
          onClick={handleScrollToAdd}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Category
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {categoryToDelete
              ? `Are you sure you want to delete "${findCategoryName(categoryToDelete) || 'this category'}"? This action cannot be undone.`
              : 'Are you sure you want to delete this category? This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={!!deletingId}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
