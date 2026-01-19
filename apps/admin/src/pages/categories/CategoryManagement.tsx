import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Snackbar,
  IconButton,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
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

interface EditingCategory extends CategoryTree {
  tempName?: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

function SortableCategoryItem({
  category,
  isEditMode,
  onNameChange,
  onAddSubCategory,
  onDelete,
  level,
}: {
  category: EditingCategory;
  isEditMode: boolean;
  onNameChange: (id: string, name: string) => void;
  onAddSubCategory: (parentId: string) => void;
  onDelete: (id: string) => void;
  level: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNameChange(category.id, e.target.value);
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        pl: level * 3,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {isEditMode && (
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
        )}
        {isEditMode ? (
          <TextField
            size="small"
            value={category.tempName ?? category.name}
            onChange={handleNameChange}
            placeholder="Category name"
            sx={{ width: 300 }}
          />
        ) : (
          <Typography variant="body1" sx={{ flex: 1 }}>
            {category.name}
          </Typography>
        )}
        {isEditMode && level === 0 && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => onAddSubCategory(category.id)}
          >
            Add Sub-category
          </Button>
        )}
        {isEditMode && !category.isNew && (
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(category.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
      {category.children.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <SortableContext
            items={category.children.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {category.children.map(child => (
              <SortableCategoryItem
                key={child.id}
                category={child}
                isEditMode={isEditMode}
                onNameChange={onNameChange}
                onAddSubCategory={onAddSubCategory}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
          </SortableContext>
        </Box>
      )}
    </Box>
  );
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [editingCategories, setEditingCategories] = useState<EditingCategory[]>(
    [],
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
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
      setEditingCategories(data);
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

  const handleEditClick = () => {
    setIsEditMode(true);
    // 创建编辑副本，添加tempName字段
    const editing = categories.map(cat => ({
      ...cat,
      tempName: cat.name,
      children: cat.children.map(child => ({
        ...child,
        tempName: child.name,
      })),
    }));
    setEditingCategories(editing);
  };

  const handleCancelClick = () => {
    setIsEditMode(false);
    setEditingCategories(categories);
  };

  const handleNameChange = (id: string, name: string) => {
    const updateCategory = (cats: EditingCategory[]): EditingCategory[] => {
      return cats.map(cat => {
        if (cat.id === id) {
          return { ...cat, tempName: name };
        }
        if (cat.children.length > 0) {
          return {
            ...cat,
            children: updateCategory(cat.children),
          };
        }
        return cat;
      });
    };
    setEditingCategories(updateCategory(editingCategories));
  };

  const handleAddCategory = () => {
    const newCategory: EditingCategory = {
      id: `new-${Date.now()}`,
      name: '',
      tempName: '',
      sequence: editingCategories.length + 1,
      parent_id: null,
      children: [],
      isNew: true,
    };
    setEditingCategories([...editingCategories, newCategory]);
  };

  const handleAddSubCategory = (parentId: string) => {
    const findAndAdd = (cats: EditingCategory[]): EditingCategory[] => {
      return cats.map(cat => {
        if (cat.id === parentId) {
          const maxSequence =
            cat.children.length > 0
              ? Math.max(...cat.children.map(c => c.sequence))
              : 0;
          const newSubCategory: EditingCategory = {
            id: `new-${Date.now()}-${Math.random()}`,
            name: '',
            tempName: '',
            sequence: maxSequence + 1,
            parent_id: parentId,
            children: [],
            isNew: true,
          };
          return {
            ...cat,
            children: [...cat.children, newSubCategory],
          };
        }
        return {
          ...cat,
          children: findAndAdd(cat.children),
        };
      });
    };
    setEditingCategories(findAndAdd(editingCategories));
  };

  const handleDelete = (id: string) => {
    const markAsDeleted = (cats: EditingCategory[]): EditingCategory[] => {
      return cats
        .map(cat => {
          if (cat.id === id) {
            return { ...cat, isDeleted: true };
          }
          return {
            ...cat,
            children: markAsDeleted(cat.children),
          };
        })
        .filter(cat => !cat.isDeleted);
    };
    setEditingCategories(markAsDeleted(editingCategories));
  };

  const findCategoryInTree = (
    cats: EditingCategory[],
    id: string,
    parent: EditingCategory | null = null,
  ): { category: EditingCategory; parent: EditingCategory | null } | null => {
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

  const collectAllCategories = (cats: EditingCategory[]): EditingCategory[] => {
    const result: EditingCategory[] = [];
    const traverse = (items: EditingCategory[]) => {
      items.forEach(cat => {
        result.push(cat);
        if (cat.children.length > 0) {
          traverse(cat.children);
        }
      });
    };
    traverse(cats);
    return result;
  };

  const collectDeletedCategories = (
    originalCats: CategoryTree[],
    currentCats: EditingCategory[],
  ): string[] => {
    const deletedIds: string[] = [];
    const currentIds = new Set(
      collectAllCategories(currentCats).map(c => c.id),
    );

    const traverse = (items: CategoryTree[]) => {
      items.forEach(cat => {
        if (!currentIds.has(cat.id)) {
          deletedIds.push(cat.id);
        }
        if (cat.children.length > 0) {
          traverse(cat.children);
        }
      });
    };
    traverse(originalCats);
    return deletedIds;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeResult = findCategoryInTree(editingCategories, active.id as string);
    const overResult = findCategoryInTree(editingCategories, over.id as string);

    if (!activeResult || !overResult) return;

    // 只能在同一级别内拖拽
    if (activeResult.parent?.id !== overResult.parent?.id) {
      return;
    }

    const siblings = activeResult.parent
      ? activeResult.parent.children
      : editingCategories;

    const oldIndex = siblings.findIndex(c => c.id === active.id);
    const newIndex = siblings.findIndex(c => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newSiblings = arrayMove(siblings, oldIndex, newIndex);
    // 更新sequence
    newSiblings.forEach((cat, index) => {
      cat.sequence = index + 1;
    });

    // 更新editingCategories
    const updateCategories = (cats: EditingCategory[]): EditingCategory[] => {
      if (activeResult.parent) {
        return cats.map(cat => {
          if (cat.id === activeResult.parent!.id) {
            return { ...cat, children: newSiblings };
          }
          return {
            ...cat,
            children: updateCategories(cat.children),
          };
        });
      } else {
        return newSiblings.map(cat => ({
          ...cat,
          children: updateCategories(cat.children),
        }));
      }
    };

    setEditingCategories(updateCategories(editingCategories));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 收集所有需要更新的数据
      const allCategories = collectAllCategories(editingCategories);

      // 分离新创建的和已存在的category
      const newCategories = allCategories.filter(c => c.isNew);
      const existingCategories = allCategories.filter(c => !c.isNew);

      // 构建creates数组（新创建的category）
      const creates = newCategories.map(cat => {
        const name = cat.tempName || cat.name;
        if (!name.trim()) {
          throw new Error('Category name cannot be empty');
        }

        // 检查parent是否也是新创建的
        const parentIsNew = cat.parent_id
          ? newCategories.some(c => c.id === cat.parent_id)
          : false;

        return {
          tempId: cat.id,
          name: name.trim(),
          parent_id: parentIsNew ? null : cat.parent_id || null,
          tempParentId: parentIsNew ? cat.parent_id : undefined,
          sequence: cat.sequence,
        };
      });

      // 构建updates数组（已存在的category，需要更新名字或sequence）
      const updates = existingCategories.map(cat => {
        const name = cat.tempName && cat.tempName.trim() !== cat.name
          ? cat.tempName.trim()
          : undefined;

        return {
          id: cat.id,
          ...(name !== undefined && { name }),
          sequence: cat.sequence,
        };
      });

      // 收集要删除的category（原始存在但现在不在列表中的）
      const deletes = collectDeletedCategories(categories, editingCategories).map(
        id => ({ id }),
      );

      // 一次性批量更新
      await api.put('/admin-category/batch', {
        creates,
        updates,
        ...(deletes.length > 0 && { deletes }),
      });

      showSnackbar('Categories saved successfully', 'success');
      setIsEditMode(false);
      await fetchCategories();
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          err.message ||
          'Failed to save categories',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>
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
          Category Management
        </Typography>
        {!isEditMode ? (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleEditClick}
          >
            Edit
          </Button>
        ) : (
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </Button>
          </Stack>
        )}
      </Box>

      <Paper sx={{ p: 3 }}>
        {isEditMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={editingCategories.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {editingCategories.map(category => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  isEditMode={true}
                  onNameChange={handleNameChange}
                  onAddSubCategory={handleAddSubCategory}
                  onDelete={handleDelete}
                  level={0}
                />
              ))}
            </SortableContext>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddCategory}
              >
                Add Category
              </Button>
            </Box>
          </DndContext>
        ) : (
          <Box>
            {categories.map(category => (
              <Box key={category.id} sx={{ mb: 2, pl: 0 }}>
                <Typography variant="body1" fontWeight="medium">
                  {category.name} (sequence: {category.sequence})
                </Typography>
                {category.children.length > 0 && (
                  <Box sx={{ mt: 1, pl: 3 }}>
                    {category.children.map(child => (
                      <Typography
                        key={child.id}
                        variant="body2"
                        color="text.secondary"
                      >
                        └─ {child.name} (sequence: {child.sequence})
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Paper>

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
    </Box>
  );
}
