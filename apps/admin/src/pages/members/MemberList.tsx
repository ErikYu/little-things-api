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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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

  const [deviceTokenDialog, setDeviceTokenDialog] = useState<{
    open: boolean;
    userId: string | null;
    deviceToken: string;
  }>({
    open: false,
    userId: null,
    deviceToken: '',
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDeviceTokenDialog = (userId: string, currentToken: string | null) => {
    setDeviceTokenDialog({
      open: true,
      userId,
      deviceToken: currentToken || '',
    });
  };

  const handleCloseDeviceTokenDialog = () => {
    setDeviceTokenDialog({
      open: false,
      userId: null,
      deviceToken: '',
    });
  };

  const handleUpdateDeviceToken = async () => {
    if (!deviceTokenDialog.userId) return;

    try {
      await api.put(`/admin-user/${deviceTokenDialog.userId}/device-token`, {
        device_token: deviceTokenDialog.deviceToken,
      });
      showSnackbar('Device token updated successfully', 'success');
      handleCloseDeviceTokenDialog();
      fetchUsers();
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to update device token',
        'error',
      );
    }
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
              <TableCell>Actions</TableCell>
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
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      handleOpenDeviceTokenDialog(user.id, user.device_token)
                    }
                  >
                    Set Token
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deviceTokenDialog.open}
        onClose={handleCloseDeviceTokenDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Device Token</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Device Token"
            type="text"
            fullWidth
            variant="outlined"
            value={deviceTokenDialog.deviceToken}
            onChange={(e) =>
              setDeviceTokenDialog({
                ...deviceTokenDialog,
                deviceToken: e.target.value,
              })
            }
            placeholder="Enter device token"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeviceTokenDialog}>Cancel</Button>
          <Button onClick={handleUpdateDeviceToken} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

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

