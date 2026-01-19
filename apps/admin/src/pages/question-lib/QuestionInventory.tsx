import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Box,
  Pagination,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  IconButton,
  Autocomplete,
  TextField,
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

export default function QuestionInventory() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
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
      setCategories(data.filter(category => !category.parent_id));
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch categories',
        'error',
      );
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response: QuestionListResponse = await api.get('/admin-question', {
        params: {
          page,
          pageSize,
          ...(selectedCategory && { categoryId: selectedCategory.id }),
        },
      });
      setQuestions(response.data);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch questions',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCategory]);

  const handleCategoryChange = (category: Category | null) => {
    setSelectedCategory(category);
    setPage(1);
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
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to delete question',
        'error',
      );
    }
  };

  if (loading && questions.length === 0) {
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

      <Box sx={{ mb: 2, maxWidth: 320 }}>
        <Autocomplete
          options={categories}
          getOptionLabel={option => option.name}
          value={selectedCategory}
          onChange={(_, newValue) => handleCategoryChange(newValue)}
          renderInput={params => (
            <TextField
              {...params}
              label="Filter by Category"
              size="small"
              variant="outlined"
              placeholder="Select a category..."
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="question table">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Cluster</TableCell>
              <TableCell>Sequence</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map(question => (
              <TableRow
                key={question.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell
                  sx={{
                    maxWidth: 320,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {question.title}
                </TableCell>
                <TableCell>
                  <strong>{question.category?.name || '-'}</strong>
                  {question.sub_category && (
                    <>
                      {' / '}
                      <strong>{question.sub_category.name}</strong>
                    </>
                  )}
                </TableCell>
                <TableCell>{question.cluster || '-'}</TableCell>
                <TableCell>{question.sequence}</TableCell>
                <TableCell>
                  {new Date(question.updated_at).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/question-lib/${question.id}`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(question)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
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
