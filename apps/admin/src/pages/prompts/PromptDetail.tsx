import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import api from '../../utils/api';
import VersionHistoryDrawer, {
  PromptVersion,
} from '../../components/VersionHistoryDrawer';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';

interface Prompt {
  id: string;
  category: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  current_version_id?: string | null;
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
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(
    null,
  );
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<PromptVersion | null>(
    null,
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

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

  const fetchVersions = async () => {
    if (isNew || !id) return;

    try {
      const data: PromptVersion[] = await api.get(
        `/admin-prompt/${id}/versions`,
      );
      setVersions(data);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch version history',
        'error',
      );
    }
  };

  const handleOpenHistory = () => {
    setHistoryDrawerOpen(true);
    if (versions.length === 0) {
      fetchVersions();
    }
  };

  const handleCloseHistory = () => {
    setHistoryDrawerOpen(false);
  };

  const handleApplyVersion = async (versionId: string) => {
    if (!id || !prompt) return;

    try {
      await api.post(`/admin-prompt/${id}/versions/${versionId}/apply`);
      showSnackbar('Version applied successfully', 'success');
      // 刷新 prompt 和版本列表
      const updatedPrompt: Prompt = await api.get(`/admin-prompt/${id}`);
      setPrompt(updatedPrompt);
      setContent(updatedPrompt.content);
      setActive(updatedPrompt.active);
      // 刷新版本列表
      await fetchVersions();
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to apply version',
        'error',
      );
    }
  };

  const handleSaveWithoutMessage = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const newPrompt: Prompt = await api.post('/admin-prompt', {
          category: 'ICON_GENERATION',
          content,
          active,
        });
        showSnackbar('Prompt saved successfully', 'success');
        // 跳转到新创建的 prompt 详情页
        navigate(`/prompts/${newPrompt.id}`);
      } else {
        // 创建版本，但 change_note 为 null
        await api.put(`/admin-prompt/${id}`, {
          content,
          active,
          change_note: null, // 不保存 change_note
        });
        showSnackbar('Prompt saved successfully', 'success');
        // 刷新 prompt 数据并退出编辑状态
        const updatedPrompt: Prompt = await api.get(`/admin-prompt/${id}`);
        setPrompt(updatedPrompt);
        setContent(updatedPrompt.content);
        setActive(updatedPrompt.active);
        setIsEditing(false);
      }
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

  const handleSave = () => {
    if (isNew) {
      // 新建时直接保存，不需要 dialog
      handleSaveWithoutMessage();
    } else {
      // 编辑时显示 commit message dialog
      setSaveDialogOpen(true);
    }
  };

  const handleSaveWithMessage = async () => {
    if (!id) return;

    setSaving(true);
    try {
      await api.put(`/admin-prompt/${id}`, {
        content,
        active,
        change_note: commitMessage || null, // 使用用户输入的 commit message
      });
      showSnackbar('Prompt saved successfully', 'success');
      setSaveDialogOpen(false);
      setCommitMessage('');
      // 刷新 prompt 数据并退出编辑状态
      const updatedPrompt: Prompt = await api.get(`/admin-prompt/${id}`);
      setPrompt(updatedPrompt);
      setContent(updatedPrompt.content);
      setActive(updatedPrompt.active);
      setIsEditing(false);
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

  const handleDeleteVersion = (version: PromptVersion) => {
    setVersionToDelete(version);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!id || !versionToDelete) return;

    try {
      await api.delete(`/admin-prompt/${id}/versions/${versionToDelete.id}`);
      showSnackbar('Version deleted successfully', 'success');
      // 刷新 prompt 和版本列表
      const updatedPrompt: Prompt = await api.get(`/admin-prompt/${id}`);
      setPrompt(updatedPrompt);
      setContent(updatedPrompt.content);
      setActive(updatedPrompt.active);
      // 刷新版本列表
      await fetchVersions();
      setDeleteDialogOpen(false);
      setVersionToDelete(null);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to delete version',
        'error',
      );
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
        {!isNew && (
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={handleOpenHistory}
            sx={{
              ml: 'auto',
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Version History
          </Button>
        )}
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
                {!isNew && (
                  <Button
                    variant="outlined"
                    onClick={handleSaveWithoutMessage}
                    disabled={saving}
                    startIcon={<SaveIcon />}
                  >
                    {saving ? 'Saving...' : 'Save without message'}
                  </Button>
                )}
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

      <VersionHistoryDrawer
        open={historyDrawerOpen}
        onClose={handleCloseHistory}
        promptId={id || ''}
        currentVersionId={prompt?.current_version_id}
        onApplyVersion={async (versionId: string) => {
          if (!id) return;
          try {
            await api.post(`/admin-prompt/${id}/versions/${versionId}/apply`);
            showSnackbar('Version applied successfully', 'success');
            // 刷新 prompt 数据
            const updatedPrompt: Prompt = await api.get(`/admin-prompt/${id}`);
            setPrompt(updatedPrompt);
            setContent(updatedPrompt.content);
            setActive(updatedPrompt.active);
            // 刷新版本列表
            fetchVersions();
          } catch (err: any) {
            showSnackbar(
              err.response?.data?.msg ||
                err.response?.data?.message ||
                'Failed to apply version',
              'error',
            );
          }
        }}
        onDeleteVersion={handleDeleteVersion}
        onDiffVersion={version => {
          setSelectedVersion(version);
          setDiffDialogOpen(true);
        }}
      />

      {/* Diff Dialog */}
      <Dialog
        open={diffDialogOpen}
        onClose={() => setDiffDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '70vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">Version Comparison</Typography>
              {selectedVersion && prompt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`v${selectedVersion.version}`}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    vs
                  </Typography>
                  <Chip
                    label={`v${versions.find(v => v.id === prompt.current_version_id)?.version || 'Current'}`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              )}
            </Box>
            <IconButton
              onClick={() => setDiffDialogOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: 'calc(70vh)' }}>
          {selectedVersion && prompt && (
            <ReactDiffViewer
              oldValue={selectedVersion.content}
              newValue={prompt.content}
              splitView={true}
              leftTitle={`v${selectedVersion.version}`}
              rightTitle={`v${versions.find(v => v.id === prompt.current_version_id)?.version || 'Current'} (Current)`}
              useDarkTheme={true}
              disableWordDiff={false}
              compareMethod={DiffMethod.LINES}
              showDiffOnly={false}
              hideLineNumbers={false}
              extraLinesSurroundingDiff={3}
              styles={{
                variables: {
                  dark: {
                    codeFoldGutterBackground: '#1e1e1e',
                    codeFoldBackground: '#1e1e1e',
                    addedBackground: '#0e4429',
                    addedColor: '#4ade80',
                    removedBackground: '#5a1a1a',
                    removedColor: '#f87171',
                    // 词级别差异高亮 - 更明显的颜色
                    wordAddedBackground: '#22c55e',
                    wordRemovedBackground: '#ef4444',
                    addedGutterBackground: '#0e4429',
                    removedGutterBackground: '#5a1a1a',
                    gutterBackground: '#1e1e1e',
                    gutterBackgroundDark: '#1e1e1e',
                    highlightBackground: '#2d2d2d',
                    highlightGutterBackground: '#2d2d2d',
                  },
                },
                contentText: {
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                },
                gutter: {
                  color: '#888',
                  background: '#1e1e1e',
                },
                line: {
                  '&:hover': {
                    background: '#2d2d2d',
                  },
                },
                // 词级别差异样式 - 增强可见性
                wordAdded: {
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontWeight: 500,
                },
                wordRemoved: {
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  textDecoration: 'line-through',
                  fontWeight: 500,
                },
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setVersionToDelete(null);
        }}
      >
        <DialogTitle>Delete Version</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete version{' '}
            <strong>v{versionToDelete?.version}</strong>?
            {versionToDelete?.id === prompt?.current_version_id && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This is the current version. After deletion, another version
                will be set as current, or the prompt will have no current
                version if this is the only version.
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setVersionToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save with Commit Message Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => {
          setSaveDialogOpen(false);
          setCommitMessage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save with Commit Message</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter a commit message for this version change. This message will be
            displayed in the version history.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Commit Message"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            placeholder="e.g., Optimized prompt for better icon generation"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSaveDialogOpen(false);
              setCommitMessage('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveWithMessage}
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
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
