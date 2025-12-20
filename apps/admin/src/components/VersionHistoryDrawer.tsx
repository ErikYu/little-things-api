import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Box,
  Button,
  Typography,
  Paper,
  Drawer,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Alert,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  created_by: string | null;
  created_at: string;
  change_note: string | null;
}

interface Prompt {
  id: string;
  current_version_id?: string | null;
}

interface VersionHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  promptId: string;
  currentVersionId?: string | null;
  onApplyVersion?: (versionId: string) => void;
  onDeleteVersion?: (version: PromptVersion) => void;
  onDiffVersion?: (version: PromptVersion) => void;
}

export default function VersionHistoryDrawer({
  open,
  onClose,
  promptId,
  currentVersionId,
  onApplyVersion,
  onDeleteVersion,
  onDiffVersion,
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set(),
  );

  const fetchVersions = async () => {
    if (!promptId) return;

    setVersionsLoading(true);
    try {
      const data: PromptVersion[] = await api.get(
        `/admin-prompt/${promptId}/versions`,
      );
      setVersions(data);
    } catch (err) {
      console.error('Failed to fetch version history', err);
    } finally {
      setVersionsLoading(false);
    }
  };

  useEffect(() => {
    if (open && promptId) {
      fetchVersions();
    }
  }, [open, promptId]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 700, md: 800 },
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: theme => theme.zIndex.drawer + 2, // 比 header (drawer + 1) 更高
        },
      }}
      sx={{
        zIndex: theme => theme.zIndex.drawer + 2, // 确保 drawer 本身也有正确的 z-index
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
              minHeight: 64, // 与 AppBar 高度一致
              px: 3,
              py: 0,
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
            onClick={onClose}
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
                const isCurrentVersion = currentVersionId === version.id;
                return (
                  <Paper
                    key={version.id}
                    elevation={isCurrentVersion ? 4 : 1}
                    sx={{
                      p: 1.5,
                      border: isCurrentVersion ? '2px solid' : '1px solid',
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
                            {new Date(version.created_at).toLocaleString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
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
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newExpanded = new Set(expandedVersions);
                            if (newExpanded.has(version.id)) {
                              newExpanded.delete(version.id);
                            } else {
                              newExpanded.add(version.id);
                            }
                            setExpandedVersions(newExpanded);
                          }}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          {expandedVersions.has(version.id) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                        {!isCurrentVersion && (
                          <>
                            {onDiffVersion && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CompareArrowsIcon />}
                                onClick={() => onDiffVersion(version)}
                                sx={{ textTransform: 'none' }}
                              >
                                Diff
                              </Button>
                            )}
                            {onApplyVersion && (
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<RestoreIcon />}
                                onClick={() => onApplyVersion(version.id)}
                                sx={{ textTransform: 'none' }}
                              >
                                Apply
                              </Button>
                            )}
                            {onDeleteVersion && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => onDeleteVersion(version)}
                                sx={{
                                  '&:hover': {
                                    bgcolor: 'error.light',
                                    color: 'error.contrastText',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </>
                        )}
                        {isCurrentVersion && onDeleteVersion && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteVersion(version)}
                            sx={{
                              '&:hover': {
                                bgcolor: 'error.light',
                                color: 'error.contrastText',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Content */}
                    <Box sx={{ position: 'relative' }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: '#1e1e1e',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          maxHeight: expandedVersions.has(version.id)
                            ? 400
                            : 100,
                          overflow: 'auto',
                          transition: 'max-height 0.3s ease-in-out',
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
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

