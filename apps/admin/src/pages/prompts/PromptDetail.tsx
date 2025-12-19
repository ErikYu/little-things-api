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
  Drawer,
  List,
  ListItem,
  Divider,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

interface Prompt {
  id: string;
  category: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  current_version_id?: string | null;
}

interface PromptVersion {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  created_by: string | null;
  created_at: string;
  change_note: string | null;
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
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);

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

    setVersionsLoading(true);
    try {
      const data: PromptVersion[] = await api.get(`/admin-prompt/${id}/versions`);
      setVersions(data);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch version history',
        'error',
      );
    } finally {
      setVersionsLoading(false);
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

      <Drawer
        anchor="right"
        open={historyDrawerOpen}
        onClose={handleCloseHistory}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 700, md: 800 },
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 3,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Version History
              </Typography>
              {versions.length > 0 && (
                <Chip
                  label={versions.length}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            <IconButton
              onClick={handleCloseHistory}
              aria-label="close"
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 3,
            }}
          >
            {versionsLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  gap: 2,
                }}
              >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Loading versions...
                </Typography>
              </Box>
            ) : versions.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  gap: 2,
                }}
              >
                <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary">
                  No version history
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Version history will appear here when you make changes
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {versions.map((version, index) => {
                  const isCurrentVersion =
                    prompt?.current_version_id === version.id;
                  return (
                    <Paper
                      key={version.id}
                      elevation={isCurrentVersion ? 4 : 1}
                      sx={{
                        p: 1.5,
                        border: isCurrentVersion
                          ? '2px solid'
                          : '1px solid',
                        borderColor: isCurrentVersion
                          ? 'primary.main'
                          : 'divider',
                        borderRadius: 2,
                        bgcolor: isCurrentVersion
                          ? 'primary.50'
                          : 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: 4,
                        },
                      }}
                    >
                      {/* Version Header */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          mb: 1,
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              mb: 0.5,
                            }}
                          >
                            <Chip
                              label={`v${version.version}`}
                              size="small"
                              color={isCurrentVersion ? 'primary' : 'default'}
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            />
                            {isCurrentVersion && (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Current"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                          {version.change_note &&
                            version.change_note !== 'Initial version' && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.primary',
                                  fontWeight: 500,
                                  mb: 0.5,
                                }}
                              >
                                {version.change_note}
                              </Typography>
                            )}
                        </Box>
                      </Box>

                      {/* Metadata */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1,
                          flexWrap: 'wrap',
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: 'text.secondary',
                            }}
                          >
                            <AccessTimeIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">
                              {new Date(version.created_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                          {version.created_by && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'text.secondary',
                              }}
                            >
                              <PersonIcon sx={{ fontSize: 16 }} />
                              <Typography variant="caption">
                                {version.created_by}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        {!isCurrentVersion && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CompareArrowsIcon />}
                            onClick={() => {
                              setSelectedVersion(version);
                              setDiffDialogOpen(true);
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            Diff
                          </Button>
                        )}
                      </Box>

                      {/* Content */}
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: '#1e1e1e',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          maxHeight: 400,
                          overflow: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            bgcolor: '#2d2d2d',
                            borderRadius: 1,
                          },
                          '&::-webkit-scrollbar-thumb': {
                            bgcolor: '#555',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: '#666',
                            },
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="pre"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: 'monospace',
                            fontSize: '0.8125rem',
                            lineHeight: 1.6,
                            m: 0,
                            color: '#d4d4d4',
                          }}
                        >
                          {version.content}
                        </Typography>
                      </Paper>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>

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
            <Typography variant="h6">Version Comparison</Typography>
            <IconButton
              onClick={() => setDiffDialogOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedVersion && prompt && (
            <Grid container spacing={2} sx={{ height: '100%' }}>
              {/* Current Version */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 1 }}>
                  <Chip
                    label={`v${versions.find(v => v.id === prompt.current_version_id)?.version || 'Current'}`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 600, mr: 1 }}
                  />
                  <Typography variant="subtitle2" component="span" color="text.secondary">
                    Current Version
                  </Typography>
                </Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: '#1e1e1e',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    height: 'calc(70vh - 120px)',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: '#2d2d2d',
                      borderRadius: 1,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: '#555',
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: '#666',
                      },
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '0.8125rem',
                      lineHeight: 1.6,
                      m: 0,
                      color: '#d4d4d4',
                    }}
                  >
                    {prompt.content}
                  </Typography>
                </Paper>
              </Grid>

              {/* Selected Version */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 1 }}>
                  <Chip
                    label={`v${selectedVersion.version}`}
                    size="small"
                    color="default"
                    sx={{ fontWeight: 600, mr: 1 }}
                  />
                  <Typography variant="subtitle2" component="span" color="text.secondary">
                    Selected Version
                  </Typography>
                </Box>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: '#1e1e1e',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    height: 'calc(70vh - 120px)',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: '#2d2d2d',
                      borderRadius: 1,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: '#555',
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: '#666',
                      },
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '0.8125rem',
                      lineHeight: 1.6,
                      m: 0,
                      color: '#d4d4d4',
                    }}
                  >
                    {selectedVersion.content}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiffDialogOpen(false)}>Close</Button>
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
