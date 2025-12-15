import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Alert,
  Stack,
  Breadcrumbs,
  Link,
  IconButton,
  Snackbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Prompt {
  id: string;
  category: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [active, setActive] = useState(false);
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

  const isNew = id === 'new';

  useEffect(() => {
    if (isNew) {
      setContent('');
      setActive(true);
      setLoading(false);
      setIsEditing(true);
      return;
    }

    const fetchPrompt = async () => {
      setLoading(true);
      try {
        const data: Prompt = await api.get(`/admin-prompt/${id}`);
        setPrompt(data);
        setContent(data.content);
        setActive(data.active);
      } catch (err: any) {
        showSnackbar(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            'Failed to fetch prompt details',
          'error',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/admin-prompt', {
          category: 'ICON_GENERATION',
          content,
          active,
        });
      } else {
        await api.put(`/admin-prompt/${id}`, {
          content,
          active,
        });
      }
      showSnackbar('Prompt saved successfully', 'success');
      // 给一点时间显示 success 消息，或者直接跳转
      // 这里的 UX 可能会有点问题，如果立即跳转，snackbar 会消失。
      // 但现在我们只关注 "报错"。
      setTimeout(() => {
        navigate('/prompts');
      }, 500);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to save',
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
            onClick={e => {
              e.preventDefault();
              navigate('/prompts');
            }}
          >
            Prompts
          </Link>
          <Typography color="text.primary">
            {isNew ? 'New Prompt' : 'Prompt Details'}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/prompts')} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h2">
          {isNew ? 'New Prompt' : 'Prompt Details'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        {!isNew && prompt && (
          <Box sx={{ mb: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
            <Stack direction="row" spacing={4}>
              <Box>
                <strong>ID:</strong> {prompt.id}
              </Box>
              <Box>
                <strong>Category:</strong> {prompt.category}
              </Box>
              <Box>
                <strong>Created At:</strong>{' '}
                {new Date(prompt.created_at).toLocaleString()}
              </Box>
              <Box>
                <strong>Updated At:</strong>{' '}
                {new Date(prompt.updated_at).toLocaleString()}
              </Box>
            </Stack>
          </Box>
        )}

        <Stack spacing={3}>
          <TextField
            label="Content"
            multiline
            rows={20}
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={!isEditing}
            fullWidth
            variant="outlined"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={active}
                onChange={e => setActive(e.target.checked)}
                disabled={!isEditing}
              />
            }
            label="Active"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={<SaveIcon />}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                {!isNew && prompt && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIsEditing(false);
                      setContent(prompt.content);
                      setActive(prompt.active);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => setIsEditing(true)}
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
            )}
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
