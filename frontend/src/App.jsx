import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BatchesPage from './pages/BatchesPage';
import BatchDetailPage from './pages/BatchDetailPage';
import BatchTrackingPage from './pages/BatchTrackingPage';
import ContainersPage from './pages/ContainersPage';
import ContainerDetailPage from './pages/ContainerDetailPage';
import SuppliersPage from './pages/SuppliersPage';
import VarietiesPage from './pages/VarietiesPage';
import GreenhousesPage from './pages/GreenhousesPage';
import GreenhouseDetailPage from './pages/GreenhouseDetailPage';
import PhaseManagementPage from './pages/PhaseManagementPage';
import UsersPage from './pages/UsersPage';
import ExportPage from './pages/ExportPage';
import ImportPage from './pages/ImportPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#22c55e',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/batches" element={
            <PrivateRoute>
              <Layout>
                <BatchesPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/batches/:id" element={
            <PrivateRoute>
              <Layout>
                <BatchDetailPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/batch-tracking" element={
            <PrivateRoute>
              <Layout>
                <BatchTrackingPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/containers" element={
            <PrivateRoute>
              <Layout>
                <ContainersPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/containers/:id" element={
            <PrivateRoute>
              <Layout>
                <ContainerDetailPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/suppliers" element={
            <PrivateRoute>
              <Layout>
                <SuppliersPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/varieties" element={
            <PrivateRoute>
              <Layout>
                <VarietiesPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/greenhouses" element={
            <PrivateRoute>
              <Layout>
                <GreenhousesPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/greenhouses/:id" element={
            <PrivateRoute>
              <Layout>
                <GreenhouseDetailPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/phase-management" element={
            <PrivateRoute>
              <Layout>
                <PhaseManagementPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/users" element={
            <PrivateRoute>
              <Layout>
                <UsersPage />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* Session 15 - Export/Import */}
          <Route path="/export" element={
            <PrivateRoute>
              <Layout>
                <ExportPage />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/import" element={
            <PrivateRoute>
              <Layout>
                <ImportPage />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
