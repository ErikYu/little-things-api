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
  Box,
  Pagination,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';

interface User {
  id: string;
  email: string | null;
  apple_id: string | null;
  created_at: string;
  last_login_at: string;
  device_token: string | null;
  _count: {
    answers: number;
  };
}

interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function MemberList() {
  const [users, setUsers] = useState<User[]>([]);
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response: UserListResponse = await api.get('/admin-user', {
        params: {
          page,
          pageSize,
        },
      });
      setUsers(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch members',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (loading && users.length === 0) {
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
          Members
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="member table">
          <TableHead>
            <TableRow>
              <TableCell>User ID</TableCell>
              <TableCell>Identity</TableCell>
              <TableCell>Answers Count</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Registered At</TableCell>
              <TableCell>Device Token</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow
                key={user.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {user.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  {user.email ? (
                    <Box>
                      <Chip label="Email" size="small" variant="outlined" sx={{ mr: 1 }} />
                      {user.email}
                    </Box>
                  ) : user.apple_id ? (
                    <Box>
                      <Chip label="Apple" size="small" variant="outlined" sx={{ mr: 1 }} />
                      {user.apple_id}
                    </Box>
                  ) : (
                    'Unknown'
                  )}
                </TableCell>
                <TableCell>{user._count.answers}</TableCell>
                <TableCell>
                  {new Date(user.last_login_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                    {user.device_token ? (
                        <Chip label="Registered" color="success" size="small" />
                    ) : (
                        <Chip label="None" color="default" size="small" />
                    )}
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

