import { Route, Routes, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import PromptList from '../pages/prompts/PromptList';
import PromptDetail from '../pages/prompts/PromptDetail';
import { getToken } from '../utils/api';

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          getToken() ? <Navigate to="/" replace /> : <Login />
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/prompts" replace />} />
        <Route path="prompts" element={<PromptList />} />
        <Route path="prompts/:id" element={<PromptDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
