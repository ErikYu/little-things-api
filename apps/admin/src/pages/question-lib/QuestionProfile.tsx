import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Snackbar,
  Stack,
  Autocomplete,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  sequence: number;
}

interface QuestionDetail {
  id: string;
  title: string;
  sequence: number;
  cluster: string | null;
  category: {
    id: string;
    name: string;
  };
  sub_category?: {
    id: string;
    name: string;
  } | null;
}

export default function QuestionProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [sequence, setSequence] = useState<number>(1);
  const [cluster, setCluster] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const selectedCategory = useMemo(() => {
    return categories.find(category => category.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

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

  const fetchQuestion = async () => {
    if (isNew || !id) {
      setLoading(false);
      return;
    }

    try {
      const data: QuestionDetail = await api.get(`/admin-question/${id}`);
      setTitle(data.title);
      setSequence(data.sequence);
      setCluster(data.cluster || '');
      setSelectedCategoryId(data.category?.id || '');
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch question',
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
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const handleSave = async () => {
    if (!title.trim()) {
      showSnackbar('Title is required', 'error');
      return;
    }

    if (!selectedCategoryId) {
      showSnackbar('Category is required', 'error');
      return;
    }

    if (!Number.isFinite(sequence) || sequence <= 0) {
      showSnackbar('Sequence must be a positive number', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category_id: selectedCategoryId,
        sequence,
        cluster: cluster.trim() || null,
      };

      if (isNew) {
        await api.post('/admin-question', payload);
        showSnackbar('Question created successfully', 'success');
      } else {
        await api.put(`/admin-question/${id}`, payload);
        showSnackbar('Question updated successfully', 'success');
      }

      navigate('/question-lib');
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to save question',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={event => {
              event.preventDefault();
              navigate('/question-lib');
            }}
          >
            Question Library
          </Link>
          <Typography color="text.primary">
            {isNew ? 'New Question' : 'Question Details'}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/question-lib')} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h2">
          {isNew ? 'New Question' : 'Question Details'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, maxWidth: 700 }}>
        <Stack spacing={3}>
          <TextField
            label="Title"
            value={title}
            onChange={event => setTitle(event.target.value)}
            fullWidth
            required
          />
          <Autocomplete
            options={categories}
            getOptionLabel={option => option.name}
            value={selectedCategory}
            onChange={(_, newValue) =>
              setSelectedCategoryId(newValue ? newValue.id : '')
            }
            renderInput={params => (
              <TextField
                {...params}
                label="Category"
                required
                placeholder="Select a category..."
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
          <TextField
            label="Sequence"
            type="number"
            inputProps={{ min: 1 }}
            value={sequence}
            onChange={event => setSequence(Number(event.target.value))}
            required
          />
          <TextField
            label="Cluster"
            value={cluster}
            onChange={event => setCluster(event.target.value)}
            placeholder="Optional"
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Stack>
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
