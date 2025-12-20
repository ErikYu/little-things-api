import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
  Pagination,
  Alert,
  Snackbar,
  Avatar,
  Tooltip,
  Button,
  CircularProgress,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BlockIcon from '@mui/icons-material/Block';

interface Reflection {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    email: string | null;
    apple_id: string | null;
  };
  icon: {
    id: string;
    url: string;
    status: string;
    bypass?: boolean;
    prompt_version?: {
      id: string;
      version: number;
      prompt_id: string;
    } | null;
  } | null;
  question: {
    id: string;
    title: string;
  };
}

interface ReflectionListResponse {
  data: Reflection[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ReflectionList() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [regeneratingIcons, setRegeneratingIcons] = useState<Set<string>>(
    new Set(),
  );

  const [retryingIcons, setRetryingIcons] = useState<
    Array<{ iconId: string; answerId: string; content: string }>
  >([]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchReflections = async () => {
    setLoading(true);
    try {
      const response: ReflectionListResponse = await api.get(
        '/admin-reflection',
        {
          params: {
            page,
            pageSize,
          },
        },
      );
      setReflections(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch reflections',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRetryingIcons = async () => {
    try {
      // API 拦截器已经提取了 response.data.data，所以返回的直接就是数据对象
      const response = (await api.get('/admin-reflection/retrying-icons')) as {
        retryingIcons: Array<{
          iconId: string;
          answerId: string;
          content: string;
        }>;
        count: number;
      };
      setRetryingIcons(response.retryingIcons || []);
    } catch (err: unknown) {
      // 静默失败，不影响主流程
      console.error('Failed to fetch retrying icons:', err);
      setRetryingIcons([]); // 出错时设置为空数组
    }
  };

  const handleRegenerateIcon = async (answerId: string) => {
    setRegeneratingIcons(prev => new Set(prev).add(answerId));
    try {
      await api.post(`/admin-reflection/${answerId}/regenerate-icon`);
      showSnackbar('Icon regeneration started successfully', 'success');
      // 延迟刷新列表，给生成一些时间
      setTimeout(() => {
        fetchReflections();
      }, 2000);
    } catch (err: unknown) {
      showSnackbar(
        (err as { response?: { data?: { msg?: string; message?: string } } })
          ?.response?.data?.msg ||
          (err as { response?: { data?: { msg?: string; message?: string } } })
            ?.response?.data?.message ||
          'Failed to regenerate icon',
        'error',
      );
    } finally {
      setRegeneratingIcons(prev => {
        const next = new Set(prev);
        next.delete(answerId);
        return next;
      });
    }
  };

  const handleSetBypass = async (answerId: string, bypass: boolean) => {
    try {
      await api.post(`/admin-reflection/${answerId}/bypass?bypass=${bypass}`);
      showSnackbar(
        `Icon bypass ${bypass ? 'enabled' : 'disabled'} successfully`,
        'success',
      );
      fetchReflections();
    } catch (err: unknown) {
      showSnackbar(
        (err as { response?: { data?: { msg?: string; message?: string } } })
          ?.response?.data?.msg ||
          (err as { response?: { data?: { msg?: string; message?: string } } })
            ?.response?.data?.message ||
          'Failed to set bypass',
        'error',
      );
    }
  };

  useEffect(() => {
    fetchReflections();
    fetchRetryingIcons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 如果有正在重试的icon，每5秒刷新一次状态
  useEffect(() => {
    if (retryingIcons.length === 0) return;

    const interval = setInterval(() => {
      fetchRetryingIcons();
      fetchReflections();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryingIcons.length]);

  if (loading && reflections.length === 0) {
    return <Box sx={{ p: 3, textAlign: 'center' }}>Loading...</Box>;
  }

  // 创建一个 Set 来快速查找正在 retry 的 answerId
  const retryingAnswerIds = new Set(retryingIcons.map(icon => icon.answerId));

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="h2">
            Reflections
          </Typography>
          {retryingIcons.length > 0 && (
            <Tooltip
              title={
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 'bold' }}
                  >
                    {retryingIcons.length} icon(s) retrying:
                  </Typography>
                  {retryingIcons.map((retryingIcon, index) => (
                    <Typography
                      key={retryingIcon.iconId}
                      variant="caption"
                      component="div"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      {index + 1}. {retryingIcon.content.substring(0, 50)}
                      {retryingIcon.content.length > 50 ? '...' : ''}
                    </Typography>
                  ))}
                </Box>
              }
              arrow
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'warning.main',
                  cursor: 'help',
                }}
              >
                <AutorenewIcon
                  sx={{
                    fontSize: 20,
                    animation: 'spin 2s linear infinite',
                    '@keyframes spin': {
                      '0%': {
                        transform: 'rotate(0deg)',
                      },
                      '100%': {
                        transform: 'rotate(360deg)',
                      },
                    },
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {retryingIcons.length}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="reflection table">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Question</TableCell>
              <TableCell>Prompt Version</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reflections.map(reflection => (
              <TableRow
                key={reflection.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {reflection.user.email ||
                        reflection.user.apple_id ||
                        'Unknown User'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {reflection.icon ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {reflection.icon.url ? (
                        <Avatar
                          src={reflection.icon.url}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                          }}
                        />
                      )}
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Chip
                          label={reflection.icon.status}
                          size="small"
                          color={
                            reflection.icon.status === 'GENERATED'
                              ? 'success'
                              : reflection.icon.status === 'FAILED'
                                ? 'error'
                                : 'warning'
                          }
                        />
                        {retryingAnswerIds.has(reflection.id) && (
                          <Chip
                            icon={<AutorenewIcon sx={{ fontSize: 14 }} />}
                            label="Retrying"
                            size="small"
                            color="warning"
                            sx={{
                              animation: 'pulse 2s ease-in-out infinite',
                              '@keyframes pulse': {
                                '0%, 100%': {
                                  opacity: 1,
                                },
                                '50%': {
                                  opacity: 0.6,
                                },
                              },
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No Icon
                    </Typography>
                  )}
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: 300,
                  }}
                >
                  <Tooltip title={reflection.content}>
                    <Typography
                      noWrap
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {reflection.content}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: 200,
                  }}
                >
                  <Tooltip title={reflection.question.title}>
                    <Typography noWrap>{reflection.question.title}</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {reflection.icon?.prompt_version ? (
                    <Chip
                      label={`v${reflection.icon.prompt_version.version}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(reflection.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {(!reflection.icon ||
                      reflection.icon.status === 'FAILED') && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                          regeneratingIcons.has(reflection.id) ? (
                            <CircularProgress size={16} />
                          ) : (
                            <RefreshIcon />
                          )
                        }
                        onClick={() => handleRegenerateIcon(reflection.id)}
                        disabled={regeneratingIcons.has(reflection.id)}
                      >
                        Regenerate
                      </Button>
                    )}
                    {reflection.icon?.status === 'FAILED' && (
                      <Button
                        variant={
                          reflection.icon.bypass ? 'contained' : 'outlined'
                        }
                        size="small"
                        startIcon={<BlockIcon />}
                        onClick={() =>
                          handleSetBypass(
                            reflection.id,
                            !reflection.icon?.bypass,
                          )
                        }
                        color={reflection.icon.bypass ? 'warning' : 'inherit'}
                      >
                        {reflection.icon.bypass ? 'Bypassed' : 'Bypass'}
                      </Button>
                    )}
                  </Box>
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
