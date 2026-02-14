import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CasesListPage from './pages/CasesListPage';
import NewCasePage from './pages/NewCasePage';
import CaseDetailPage from './pages/CaseDetailPage';
import UsersPage from './pages/UsersPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import SupplyChainReviewPage from './pages/SupplyChainReviewPage';
import SubscriptionPage from './pages/SubscriptionPage';     // v8 新增
import ResourcesPage from './pages/ResourcesPage';           // v8 新增
import TrainingCenter from './pages/TrainingCenter';
import CourseDetail from './pages/CourseDetail';
import LessonView from './pages/LessonView';
import ExamPage from './pages/ExamPage';
import CertificatesPage from './pages/CertificatesPage';
import TrainingAdmin from './pages/TrainingAdmin';


function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        {/* Protected Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cases" element={<CasesListPage />} />
          <Route path="cases/new" element={<NewCasePage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="supply-chain-review" element={<SupplyChainReviewPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />   {/* v8 新增 */}
          <Route path="resources" element={<ResourcesPage />} />         {/* v8 新增 */}
          <Route path="training" element={<TrainingCenter />} />
          <Route path="training/courses/:courseId" element={<CourseDetail />} />
          <Route path="training/lessons/:lessonId" element={<LessonView />} />
          <Route path="training/courses/:courseId/exam" element={<ExamPage />} />
          <Route path="training/certificates" element={<CertificatesPage />} />
          <Route path="training/admin" element={<TrainingAdmin />} />

        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
