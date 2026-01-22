import { Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from '../pages/Login';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import PromptList from '../pages/prompts/PromptList';
import PromptDetail from '../pages/prompts/PromptDetail';
import ReflectionList from '../pages/reflections/ReflectionList';
import MemberList from '../pages/members/MemberList';
import Notification from '../pages/notification/Notification';
import QuestionInventory from '../pages/question-lib/QuestionInventory';
import QuestionProfile from '../pages/question-lib/QuestionProfile';
import CategoryLibManagement from '../pages/category-lib/CategoryLibManagement';
import FeatureFlagList from '../pages/feature-flags/FeatureFlagList';
import { getToken } from '../utils/api';
import theme from '../theme';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/question-lib" replace />} />
          <Route path="prompts" element={<PromptList />} />
          <Route path="prompts/:id" element={<PromptDetail />} />
          <Route path="reflections" element={<ReflectionList />} />
          <Route path="members" element={<MemberList />} />
          <Route path="notification" element={<Notification />} />
          <Route path="question-lib" element={<QuestionInventory />} />
          <Route path="question-lib/new" element={<QuestionProfile />} />
          <Route path="question-lib/:id" element={<QuestionProfile />} />
          <Route path="category-lib" element={<CategoryLibManagement />} />
          <Route path="feature-flags" element={<FeatureFlagList />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
