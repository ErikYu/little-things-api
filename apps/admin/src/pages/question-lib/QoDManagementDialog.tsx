import { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Typography,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';

interface Question {
  id: string;
  title: string;
  sequence: number;
  cluster: string | null;
  updated_at: string;
  category: {
    id: string;
    name: string;
  };
  sub_category?: {
    id: string;
    name: string;
  } | null;
}

interface QuestionListResponse {
  data: Question[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface FixedQoDQuestion {
  id: string;
  question_id: string;
  sequence: number;
  question: {
    id: string;
    title: string;
    category: {
      id: string;
      name: string;
    };
    sub_category: {
      id: string;
      name: string;
    } | null;
    cluster: string | null;
  };
}

interface QoDManagementDialogProps {
  open: boolean;
  onClose: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function QoDManagementDialog({
  open,
  onClose,
  onError,
  onSuccess,
}: QoDManagementDialogProps) {
  const [fixedQoDQuestions, setFixedQoDQuestions] = useState<
    FixedQoDQuestion[]
  >([]);
  const [loadingFixedQoD, setLoadingFixedQoD] = useState(false);
  const [allQuestionsForQoD, setAllQuestionsForQoD] = useState<Question[]>([]);
  const [loadingAllQuestions, setLoadingAllQuestions] = useState(false);
  const [selectedQuestionForAdd, setSelectedQuestionForAdd] =
    useState<Question | null>(null);

  const fetchFixedQoDQuestions = async () => {
    setLoadingFixedQoD(true);
    try {
      const data: FixedQoDQuestion[] = await api.get(
        '/admin-question/qod-fixed',
      );
      // 确保数据是数组且过滤掉无效项
      setFixedQoDQuestions(
        Array.isArray(data) ? data.filter(q => q && q.question_id) : [],
      );
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { msg?: string; message?: string } };
      };
      onError(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          'Failed to fetch fixed QoD questions',
      );
      setFixedQoDQuestions([]);
    } finally {
      setLoadingFixedQoD(false);
    }
  };

  const fetchAllQuestionsForQoD = async () => {
    setLoadingAllQuestions(true);
    try {
      const response: QuestionListResponse = await api.get('/admin-question', {
        params: {
          page: 1,
          pageSize: 10000,
        },
      });
      setAllQuestionsForQoD(response.data);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { msg?: string; message?: string } };
      };
      onError(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          'Failed to fetch questions',
      );
    } finally {
      setLoadingAllQuestions(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFixedQoDQuestions();
      fetchAllQuestionsForQoD();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAddFixedQoD = async () => {
    if (!selectedQuestionForAdd) {
      onError('Please select a question');
      return;
    }

    if (fixedQoDQuestions.length >= 3) {
      onError('Maximum 3 fixed questions allowed');
      return;
    }

    // 保存当前状态以便回滚
    const previousFixedQoD = [...fixedQoDQuestions];
    const previousAllQuestions = [...allQuestionsForQoD];

    // 乐观更新：立即更新本地状态
    const nextSequence = fixedQoDQuestions.length + 1;
    const newFixedQoD: FixedQoDQuestion = {
      id: `temp-${Date.now()}`, // 临时 ID，API 会返回真实 ID
      question_id: selectedQuestionForAdd.id,
      sequence: nextSequence,
      question: {
        id: selectedQuestionForAdd.id,
        title: selectedQuestionForAdd.title,
        category: selectedQuestionForAdd.category,
        sub_category: selectedQuestionForAdd.sub_category || null,
        cluster: selectedQuestionForAdd.cluster,
      },
    };

    const questionIdToAdd = selectedQuestionForAdd.id;

    setFixedQoDQuestions([...fixedQoDQuestions, newFixedQoD]);
    setAllQuestionsForQoD(
      allQuestionsForQoD.filter(q => q.id !== questionIdToAdd),
    );
    setSelectedQuestionForAdd(null);

    try {
      const response = await api.post(
        `/admin-question/qod-fixed/${questionIdToAdd}`,
      );
      // 使用 API 返回的真实数据更新状态，如果格式正确
      if (response.data && response.data.id && response.data.question_id) {
        // 用真实数据替换临时数据
        const updatedFixedQoD = fixedQoDQuestions.map(q =>
          q.id.startsWith('temp-') && q.question_id === questionIdToAdd
            ? response.data
            : q,
        );
        setFixedQoDQuestions(updatedFixedQoD);
      }
      // 如果格式不对，保持当前的乐观更新状态
      onSuccess('Question added to fixed QoD');
    } catch (err: unknown) {
      // 失败时回滚到之前的状态
      setFixedQoDQuestions(previousFixedQoD);
      setAllQuestionsForQoD(previousAllQuestions);
      setSelectedQuestionForAdd(selectedQuestionForAdd);
      const error = err as {
        response?: { data?: { msg?: string; message?: string } };
      };
      onError(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          'Failed to add fixed question',
      );
    }
  };

  const handleRemoveFixedQoD = async (questionId: string) => {
    // 保存当前状态以便回滚
    const previousFixedQoD = [...fixedQoDQuestions];
    const previousAllQuestions = [...allQuestionsForQoD];

    // 找到要删除的问题
    const questionToRemove = fixedQoDQuestions.find(
      q => q.question_id === questionId,
    );
    if (!questionToRemove) return;

    // 找到对应的原始问题（从 allQuestionsForQoD 中）
    const originalQuestion =
      allQuestionsForQoD.find(q => q.id === questionId) || {
        id: questionToRemove.question.id,
        title: questionToRemove.question.title,
        sequence: 0,
        cluster: questionToRemove.question.cluster,
        updated_at: '',
        category: questionToRemove.question.category,
        sub_category: questionToRemove.question.sub_category,
      };

    // 乐观更新：立即更新本地状态
    const updatedFixedQoD = fixedQoDQuestions
      .filter(q => q.question_id !== questionId)
      .map((q, index) => ({
        ...q,
        sequence: index + 1,
      }));

    setFixedQoDQuestions(updatedFixedQoD);
    setAllQuestionsForQoD([...allQuestionsForQoD, originalQuestion]);

    try {
      await api.delete(`/admin-question/qod-fixed/${questionId}`);
      onSuccess('Question removed from fixed QoD');
      // 成功后不需要重新获取，状态已经更新
    } catch (err: unknown) {
      // 失败时回滚到之前的状态
      setFixedQoDQuestions(previousFixedQoD);
      setAllQuestionsForQoD(previousAllQuestions);
      const error = err as {
        response?: { data?: { msg?: string; message?: string } };
      };
      onError(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          'Failed to remove fixed question',
      );
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    // 保存当前状态以便回滚
    const previousState = [...fixedQoDQuestions];

    // 乐观更新：立即更新本地状态
    const newOrder = [...fixedQoDQuestions];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;

    // 更新 sequence 字段
    const updatedOrder = newOrder.map((q, i) => ({
      ...q,
      sequence: i + 1,
    }));

    setFixedQoDQuestions(updatedOrder);

    const questionIds = updatedOrder.map(q => q.question_id);
    try {
      await api.put('/admin-question/qod-fixed/reorder', { questionIds });
      // 成功后不需要重新获取，状态已经更新
    } catch (err: unknown) {
      // 失败时回滚到之前的状态
      setFixedQoDQuestions(previousState);
      const error = err as {
        response?: { data?: { msg?: string; message?: string } };
      };
      onError(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          'Failed to update order',
      );
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === fixedQoDQuestions.length - 1) return;

    // 保存当前状态以便回滚
    const previousState = [...fixedQoDQuestions];

    // 乐观更新：立即更新本地状态
    const newOrder = [...fixedQoDQuestions];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;

    // 更新 sequence 字段
    const updatedOrder = newOrder.map((q, i) => ({
      ...q,
      sequence: i + 1,
    }));

    setFixedQoDQuestions(updatedOrder);

    const questionIds = updatedOrder.map(q => q.question_id);
    try {
      await api.put('/admin-question/qod-fixed/reorder', { questionIds });
      // 成功后不需要重新获取，状态已经更新
    } catch (err: unknown) {
      // 失败时回滚到之前的状态
      setFixedQoDQuestions(previousState);
      const error = err as {
        response?: { data?: { msg?: string; message?: string } };
      };
      onError(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          'Failed to update order',
      );
    }
  };

  // 获取可用于添加的问题（排除已固定的）
  const availableQuestionsForQoD = useMemo(() => {
    const fixedQuestionIds = new Set(
      fixedQoDQuestions
        .filter(q => q && q.question_id)
        .map(q => q.question_id),
    );
    return allQuestionsForQoD.filter(q => !fixedQuestionIds.has(q.id));
  }, [allQuestionsForQoD, fixedQoDQuestions]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="qod-dialog-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="qod-dialog-title">
        Fixed Questions ({fixedQoDQuestions.length}/3)
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            {loadingFixedQoD ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : fixedQoDQuestions.length === 0 ? (
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No fixed questions. Add questions below.
                </Typography>
              </Paper>
            ) : (
              <List>
                {fixedQoDQuestions
                  .filter(q => q && q.question_id)
                  .map((fixedQoD, index) => (
                    <ListItem
                      key={fixedQoD.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'background.paper',
                      }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            edge="end"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            size="small"
                          >
                            <ArrowUpwardIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === fixedQoDQuestions.length - 1}
                            size="small"
                          >
                            <ArrowDownwardIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() =>
                              handleRemoveFixedQoD(fixedQoD.question_id)
                            }
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {fixedQoD.question.title}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            Category: {fixedQoD.question.category.name}
                            {fixedQoD.question.sub_category &&
                              ` | Sub-category: ${fixedQoD.question.sub_category.name}`}
                            {fixedQoD.question.cluster &&
                              ` | Cluster: ${fixedQoD.question.cluster}`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Add Question
            </Typography>
            {fixedQoDQuestions.length >= 3 ? (
              <Alert severity="info">
                Maximum 3 fixed questions allowed. Remove one to add another.
              </Alert>
            ) : (
              <Stack spacing={2}>
                <Autocomplete
                  options={availableQuestionsForQoD}
                  getOptionLabel={option => option.title}
                  value={selectedQuestionForAdd}
                  onChange={(_, newValue) => {
                    setSelectedQuestionForAdd(newValue);
                  }}
                  loading={loadingAllQuestions}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Select Question"
                      placeholder="Search for a question..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingAllQuestions ? (
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
                          {option.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.category.name}
                          {option.sub_category &&
                            ` | ${option.sub_category.name}`}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddFixedQoD}
                  disabled={!selectedQuestionForAdd}
                  fullWidth
                >
                  Add to Fixed QoD
                </Button>
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
