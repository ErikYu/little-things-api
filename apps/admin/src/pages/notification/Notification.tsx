import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Snackbar,
  Autocomplete,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface User {
  id: string;
  email: string | null;
  apple_id: string | null;
  device_token: string | null;
}

interface NotificationHistory {
  id: string;
  user_id: string;
  device_token: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  topic: string | null;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string | null;
    apple_id: string | null;
  };
}

interface HistoryResponse {
  data: NotificationHistory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function Notification() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState('today_question');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [histories, setHistories] = useState<NotificationHistory[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);

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

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const response: { data: User[]; total: number } = await api.get(
        '/admin-user/with-device-token',
      );
      setUsers(response.data);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch users',
        'error',
      );
    } finally {
      setFetchingUsers(false);
    }
  };

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const response: HistoryResponse = await api.get(
        '/admin-notification/history',
        {
          params: {
            page: historyPage,
            pageSize: 20,
          },
        },
      );
      setHistories(response.data);
      setHistoryTotalPages(response.totalPages);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch history',
        'error',
      );
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPage]);

  const handleSend = async () => {
    if (!selectedUser) {
      showSnackbar('Please select a user', 'error');
      return;
    }

    if (!body.trim()) {
      showSnackbar('Notification body is required', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin-notification/send', {
        userId: selectedUser.id,
        title: title.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        body: body.trim(),
        topic: topic,
      });

      showSnackbar('Notification sent successfully', 'success');
      // 清空表单
      setSelectedUser(null);
      setTitle('');
      setSubtitle('');
      setBody('');
      setTopic('today_question');
      // 刷新历史记录
      fetchHistory();
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to send notification',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
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
        <Typography variant="h5" component="h2">
          Send Notification
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Autocomplete
                options={users}
                getOptionLabel={option =>
                  option.email || option.apple_id || option.id
                }
                value={selectedUser}
                onChange={(event, newValue) => {
                  setSelectedUser(newValue);
                }}
                loading={fetchingUsers}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Select User"
                    placeholder="Search for a user..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {fetchingUsers ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography variant="body1">
                        {option.email || option.apple_id || option.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {option.id}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />

              <TextField
                label="Title (Optional)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                fullWidth
                placeholder="Enter notification title"
              />

              <TextField
                label="Subtitle (Optional)"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                fullWidth
                placeholder="Enter notification subtitle"
              />

              <TextField
                label="Body *"
                value={body}
                onChange={e => setBody(e.target.value)}
                fullWidth
                required
                multiline
                rows={4}
                placeholder="Enter notification message"
              />

              <FormControl fullWidth>
                <InputLabel>Topic</InputLabel>
                <Select
                  value={topic}
                  label="Topic"
                  onChange={e => setTopic(e.target.value)}
                >
                  <MenuItem value="today_question">Today Question</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleSend}
                disabled={loading || !selectedUser || !body.trim()}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SendIcon />
                }
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {loading ? 'Sending...' : 'Send Notification'}
              </Button>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
              Send History
            </Typography>
            {fetchingHistory && histories.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Body</TableCell>
                        <TableCell>Topic</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {histories.map(history => (
                        <TableRow
                          key={history.id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {history.user.email ||
                                history.user.apple_id ||
                                history.user.id}
                            </Typography>
                            {history.error && (
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {history.error}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={history.status}
                              color={getStatusColor(history.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {history.title || (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                -
                              </Typography>
                            )}
                            {history.subtitle && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {history.subtitle}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 200,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={history.body || ''}
                          >
                            {history.body}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {history.topic || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {new Date(history.created_at).toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {historyTotalPages > 1 && (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
                  >
                    <Pagination
                      count={historyTotalPages}
                      page={historyPage}
                      onChange={(e, value) => setHistoryPage(value)}
                      color="primary"
                      size="small"
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>
      </Box>

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
