import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './theme';
import Login from './views/Login';
import WorkflowList from './views/WorkflowList';
import WorkflowEditor from './views/WorkflowEditor';
import WorkflowInstances from './views/WorkflowInstances';
import WorkflowInstanceDetail from './views/WorkflowInstanceDetail';

// 简单的认证路由守卫
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/workflows"
              element={
                <PrivateRoute>
                  <WorkflowList />
                </PrivateRoute>
              }
            />
            <Route
              path="/workflow/create"
              element={
                <PrivateRoute>
                  <WorkflowEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/workflow/edit/:id"
              element={
                <PrivateRoute>
                  <WorkflowEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/instances"
              element={
                <PrivateRoute>
                  <WorkflowInstances />
                </PrivateRoute>
              }
            />
            <Route
              path="/instances/:id"
              element={
                <PrivateRoute>
                  <WorkflowInstanceDetail />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/workflows" />} />
          </Routes>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

