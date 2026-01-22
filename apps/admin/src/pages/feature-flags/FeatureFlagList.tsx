import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function FeatureFlagList() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const response: FeatureFlag[] = await api.get('/admin-feature-flag');
      setFlags(response);
    } catch (err: any) {
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to fetch feature flags',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (flag: FeatureFlag, newEnabled: boolean) => {
    // 乐观更新
    setFlags(prevFlags =>
      prevFlags.map(f => (f.id === flag.id ? { ...f, enabled: newEnabled } : f)),
    );

    try {
      await api.put(`/admin-feature-flag/${flag.id}`, {
        enabled: newEnabled,
      });
      showSnackbar(
        `Feature flag "${flag.name}" ${newEnabled ? 'enabled' : 'disabled'}`,
        'success',
      );
    } catch (err: any) {
      // 回滚
      setFlags(prevFlags =>
        prevFlags.map(f => (f.id === flag.id ? { ...f, enabled: !newEnabled } : f)),
      );
      showSnackbar(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          'Failed to update feature flag',
        'error',
      );
    }
  };

  if (loading && flags.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
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
          Feature Flags
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {flags.map(flag => (
          <Card key={flag.id} variant="outlined">
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" component="h3">
                      {flag.name}
                    </Typography>
                    <Chip
                      label={flag.enabled ? 'Enabled' : 'Disabled'}
                      color={flag.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  {flag.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {flag.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(flag.created_at).toLocaleString()} | Updated:{' '}
                    {new Date(flag.updated_at).toLocaleString()}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={flag.enabled}
                      onChange={e => handleToggle(flag, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={flag.enabled ? 'On' : 'Off'}
                  labelPlacement="end"
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {flags.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No feature flags found
          </Typography>
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
