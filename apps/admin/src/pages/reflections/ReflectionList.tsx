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
  Link,
  Tooltip,
} from '@mui/material';

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

  useEffect(() => {
    fetchReflections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (loading && reflections.length === 0) {
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
          Reflections
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="reflection table">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Question</TableCell>
              <TableCell>Created At</TableCell>
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
                  {new Date(reflection.created_at).toLocaleString()}
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

