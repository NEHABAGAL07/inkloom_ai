import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ContentAuditPage } from './pages/ContentAuditPage';
import { AuditResultsPage } from './pages/AuditResultsPage';
import { ContentLibraryPage } from './pages/ContentLibraryPage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/audit/new" element={<ContentAuditPage />} />
          <Route path="/audits" element={<AuditResultsPage />} />
          <Route path="/content" element={<ContentLibraryPage />} />
          <Route path="/content/:id" element={<ContentDetailPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="/reviews" element={<ReviewQueuePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
