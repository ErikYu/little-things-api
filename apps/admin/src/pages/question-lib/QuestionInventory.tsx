import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Paper,
  Button,
  Typography,
  Box,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  IconButton,
  Tabs,
  Tab,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  sequence: number;
}

interface Question {
  id: string;
  title: string;
  sequence: number;
  cluster: string | null;
  updated_at: string;
  category: {
    id: string;
    name: string;
  };
  sub_category?: {
    id: string;
    name: string;
  } | null;
}

interface QuestionListResponse {
  data: Question[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface QuestionsBySubCategory {
  [subCategoryId: string]: {
    subCategory: { id: string; name: string } | null;
    questions: Question[];
  };
}

export default function QuestionInventory() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null,
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchCategories = async () => {
    try {
      const data: Category[] = await api.get('/admin-question/categories');
      const parents = data
        .filter(category => !category.parent_id)
        .sort((a, b) => a.sequence - b.sequence);
      setParentCategories(parents);
      // 默认选择第一个 parent category
      if (parents.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(parents[0].id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string; message?: string } } };
      showSnackbar(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          'Failed to fetch categories',
        'error',
      );
    }
  };

  const fetchQuestions = async () => {
    if (!selectedCategoryId) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 获取该 parent category 下的所有 questions（使用大 pageSize 获取全部）
      const response: QuestionListResponse = await api.get('/admin-question', {
        params: {
          page: 1,
          pageSize: 10000, // 获取所有数据
          categoryId: selectedCategoryId,
        },
      });
      setQuestions(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string; message?: string } } };
      showSnackbar(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          'Failed to fetch questions',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  // 按 sub category 分组 questions
  const questionsBySubCategory = useMemo<QuestionsBySubCategory>(() => {
    const grouped: QuestionsBySubCategory = {};
    
    questions.forEach(question => {
      const subCategoryId = question.sub_category?.id || 'no-subcategory';
      
      if (!grouped[subCategoryId]) {
        grouped[subCategoryId] = {
          subCategory: question.sub_category || null,
          questions: [],
        };
      }
      
      grouped[subCategoryId].questions.push(question);
    });
    
    // 按 sequence 排序每个 sub category 下的 questions
    Object.keys(grouped).forEach(key => {
      grouped[key].questions.sort((a, b) => a.sequence - b.sequence);
    });
    
    return grouped;
  }, [questions]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedCategoryId(newValue);
  };

  const handleDeleteClick = (question: Question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;
    try {
      await api.delete(`/admin-question/${questionToDelete.id}`);
      showSnackbar('Question deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      fetchQuestions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string; message?: string } } };
      showSnackbar(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          'Failed to delete question',
        'error',
      );
    }
  };

  if (loading && questions.length === 0 && !selectedCategoryId) {
    return <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>;
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
          Question Library
        </Typography>
        <Button variant="contained" onClick={() => navigate('/question-lib/new')}>
          New Question
        </Button>
      </Box>

      {parentCategories.length > 0 && (
        <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedCategoryId}
            onChange={handleTabChange}
            aria-label="parent category tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {parentCategories.map(category => (
              <Tab
                key={category.id}
                label={category.name}
                value={category.id}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {loading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>Loading questions...</Box>
      ) : (
        <Box>
          {Object.keys(questionsBySubCategory).length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No questions found in this category.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {Object.entries(questionsBySubCategory).map(
                ([subCategoryId, group]) => (
                  <Card key={subCategoryId} variant="outlined">
                    <CardContent>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        {group.subCategory?.name || 'No Sub-category'}
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Stack spacing={1}>
                        {group.questions.map(question => (
                          <Box
                            key={question.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1.5,
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 500,
                                  mb: 0.5,
                                }}
                              >
                                {question.title}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={2}
                                sx={{ mt: 0.5 }}
                              >
                                {question.cluster && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Cluster: {question.cluster}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  Sequence: {question.sequence}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Updated: {new Date(question.updated_at).toLocaleDateString()}
                                </Typography>
                              </Stack>
                            </Box>
                            <Box sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => navigate(`/question-lib/${question.id}`)}
                                aria-label="edit question"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteClick(question)}
                                aria-label="delete question"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ),
              )}
            </Stack>
          )}
        </Box>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-question-title"
        aria-describedby="delete-question-description"
      >
        <DialogTitle id="delete-question-title">Confirm Delete?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-question-description">
            This action cannot be undone. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
