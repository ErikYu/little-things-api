import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import VersionHistoryDrawer from '../../components/VersionHistoryDrawer';
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
  Chip,
  Box,
  Pagination,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';

interface Prompt {
  id: string;
  category: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  versionCount?: number;
  current_version_id?: string | null;
}

interface PromptListResponse {
  data: Prompt[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function PromptList() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedPromptCurrentVersionId, setSelectedPromptCurrentVersionId] =
    useState<string | null>(null);

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

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const response: PromptListResponse = await api.get('/admin-prompt', {
        params: {
          page,
          pageSize,
        },
      });
      setPrompts(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch prompts',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDeleteClick = (id: string) => {
    setPromptToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promptToDelete) return;

    try {
      await api.delete(`/admin-prompt/${promptToDelete}`);
      setDeleteDialogOpen(false);
      setPromptToDelete(null);
      showSnackbar('Prompt deleted successfully', 'success');
      fetchPrompts();
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to delete',
        'error',
      );
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPromptToDelete(null);
  };

  if (loading && prompts.length === 0) {
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
          Prompts
        </Typography>
        {/* Temporarily hidden */}
        {/* <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/prompts/new')}
        >
          New Prompt
        </Button> */}
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Versions</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prompts.map(prompt => (
              <TableRow
                key={prompt.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>{prompt.category}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: 300,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {prompt.content}
                </TableCell>
                <TableCell>
                  <Chip
                    label={prompt.active ? 'Active' : 'Inactive'}
                    color={prompt.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<HistoryIcon sx={{ fontSize: 16 }} />}
                    label={`${prompt.versionCount ?? 0} versions`}
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      setSelectedPromptId(prompt.id);
                      setSelectedPromptCurrentVersionId(
                        (
                          prompt as Prompt & {
                            current_version_id?: string | null;
                          }
                        ).current_version_id || null,
                      );
                      setHistoryDrawerOpen(true);
                    }}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        borderColor: 'primary.main',
                        transform: 'translateY(-1px)',
                        boxShadow: 2,
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  />
                </TableCell>
                <TableCell>
                  {new Date(prompt.created_at).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/prompts/${prompt.id}`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(prompt.id)}
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
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{'Confirm Delete?'}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
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

      <VersionHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => {
          setHistoryDrawerOpen(false);
          setSelectedPromptId(null);
          setSelectedPromptCurrentVersionId(null);
        }}
        promptId={selectedPromptId || ''}
        currentVersionId={selectedPromptCurrentVersionId}
        onApplyVersion={async (versionId: string) => {
          if (!selectedPromptId) return;
          try {
            await api.post(
              `/admin-prompt/${selectedPromptId}/versions/${versionId}/apply`,
            );
            showSnackbar('Version applied successfully', 'success');
            // 刷新列表数据
            fetchPrompts();
            // 更新当前版本ID
            const updatedPrompt: Prompt = await api.get(
              `/admin-prompt/${selectedPromptId}`,
            );
            setSelectedPromptCurrentVersionId(
              updatedPrompt.current_version_id || null,
            );
          } catch (err: any) {
            showSnackbar(
              err.response?.data?.msg ||
                err.response?.data?.message ||
                'Failed to apply version',
              'error',
            );
          }
        }}
      />

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
