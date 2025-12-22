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
  Autocomplete,
  TextField,
  IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BlockIcon from '@mui/icons-material/Block';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

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

interface User {
  id: string;
  email: string | null;
  apple_id: string | null;
}

export default function ReflectionList() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

  const fetchUsers = async () => {
    try {
      const response: { data: User[] } = await api.get('/admin-user', {
        params: {
          page: 1,
          pageSize: 1000, // 获取所有用户用于过滤
        },
      });
      setUsers(response.data);
    } catch (err: unknown) {
      // 静默失败，不影响主流程
      console.error('Failed to fetch users:', err);
    }
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
            ...(selectedUser && { userId: selectedUser.id }),
          },
        },
      );
      setReflections(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { msg?: string; message?: string } };
      };
      showSnackbar(
        error?.response?.data?.msg ||
          error?.response?.data?.message ||
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
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchReflections();
    fetchRetryingIcons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedUser]);

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

  const handleUserChange = (user: User | null) => {
    setSelectedUser(user);
    setPage(1); // 重置到第一页
  };

  const handleExport = async () => {
    if (!selectedUser) {
      showSnackbar('Please select a user first', 'error');
      return;
    }

    try {
      // 后端 TransformInterceptor 返回 { success, msg, data }
      // 前端拦截器提取 response.data.data，所以这里得到的是后端原始返回的数据
      // 后端返回 { data: [...] }，所以这里得到 { data: [...] }
      const response = (await api.get(
        `/admin-reflection/export/${selectedUser.id}`,
      )) as { data: Array<{ time: string; question: string; answer: string }> };

      const data = response?.data;

      if (!data || !Array.isArray(data) || data.length === 0) {
        showSnackbar('No data to export', 'error');
        return;
      }

      // 转换为 CSV
      const escapeCsvField = (field: string): string => {
        if (field === null || field === undefined) return '""';
        const str = String(field);
        // 如果包含逗号、引号或换行符，需要用引号包裹并转义引号
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const headers = ['Time', 'Question', 'Answer'];
      const csvRows = [
        headers.join(','),
        ...data.map(
          (row: { time: string; question: string; answer: string }) => {
            return [
              escapeCsvField(row.time || ''),
              escapeCsvField(row.question || ''),
              escapeCsvField(row.answer || ''),
            ].join(',');
          },
        ),
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `user_answers_${selectedUser.email || selectedUser.apple_id || selectedUser.id}_${new Date().toISOString().split('T')[0]}.csv`,
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSnackbar('Export successful', 'success');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { msg?: string; message?: string } };
      };
      showSnackbar(
        error?.response?.data?.msg ||
          error?.response?.data?.message ||
          'Failed to export data',
        'error',
      );
    }
  };

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
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 300 }}
        >
          <Autocomplete
            options={users}
            getOptionLabel={option =>
              option.email || option.apple_id || 'Unknown User'
            }
            value={selectedUser}
            onChange={(_, newValue) => handleUserChange(newValue)}
            renderInput={params => (
              <TextField
                {...params}
                label="Filter by User"
                size="small"
                variant="outlined"
                placeholder="Select a user..."
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ flex: 1 }}
          />
          <Tooltip title="Export user answers in csv">
            <span>
              <IconButton
                onClick={handleExport}
                disabled={!selectedUser}
                color="primary"
              >
                <FileDownloadIcon />
              </IconButton>
            </span>
          </Tooltip>
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
