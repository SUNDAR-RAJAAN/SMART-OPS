import React, { useState, useEffect } from 'react';
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSelectTaskID={handleSelectTaskID}
      />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
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
      </main>

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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
