import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { ThemeModeProvider } from './context/ThemeModeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api/client';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import SmartSearchModal from './components/SmartSearchModal';
import TaskDetailModal from './components/TaskDetailModal';
import LoginPage from './pages/LoginPage';
import EmployeeView from './pages/EmployeeView';
import ManagerView from './pages/ManagerView';
import AdminView from './pages/AdminView';
import AnalyticsView from './pages/AnalyticsView';

function MainApp() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('team-board');
  const [tasks, setTasks] = useState([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Set default tab according to role
  useEffect(() => {
    if (user?.role === 'employee') setActiveTab('my-tasks');
    else if (user?.role === 'manager') setActiveTab('team-board');
    else if (user?.role === 'admin') setActiveTab('workspace-settings');
  }, [user?.role]);

  // Global hotkey listeners (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchTasks = async () => {
    if (!token) return;
    try {
      const res = await api.search('', token);
      setTasks(res.results || []);
    } catch (err) {
      console.error('Failed fetching tasks:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  if (!user) {
    return <LoginPage />;
  }

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const updated = await api.updateTaskStatus(taskId, newStatus, token);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updated : t))
      );
    } catch (err) {
      alert(`Rollback: Failed to update status - ${err.message}`);
      fetchTasks();
    }
  };

  const handleSelectTaskID = (taskId) => {
    const target = tasks.find((t) => t.id === taskId);
    if (target) {
      setSelectedTask(target);
    } else {
      fetchTasks().then(() => {
        const found = tasks.find((t) => t.id === taskId);
        if (found) setSelectedTask(found);
      });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSelectTaskID={handleSelectTaskID}
      />

      <Container maxWidth="xl" sx={{ flex: 1, py: 3, px: { xs: 2, md: 3 } }}>
        {activeTab === 'my-tasks' && (
          <EmployeeView
            tasks={tasks}
            onSelectTask={setSelectedTask}
            onUpdateStatus={handleUpdateStatus}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
        )}

        {activeTab === 'team-board' && (
          <ManagerView
            tasks={tasks}
            onSelectTask={setSelectedTask}
            onUpdateStatus={handleUpdateStatus}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}

        {activeTab === 'workspace-settings' && (
          <AdminView tasks={tasks} />
        )}
      </Container>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      {/* 3-Tier Smart Search Modal */}
      <SmartSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTask={setSelectedTask}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={() => fetchTasks()}
      />
    </Box>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeModeProvider>
  );
}
