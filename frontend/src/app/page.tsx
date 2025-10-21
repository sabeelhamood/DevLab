'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useQuestionStore } from '@/stores/questionStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentSessions } from '@/components/dashboard/RecentSessions';
import { ProgressOverview } from '@/components/dashboard/ProgressOverview';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { loadRecentSessions, loadProgressData } = useQuestionStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      // Load dashboard data
      loadRecentSessions();
      loadProgressData();
    }
  }, [isAuthenticated, isLoading, router, loadRecentSessions, loadProgressData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <WelcomeCard user={user} />
          
          {/* Quick Actions */}
          <QuickActions />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Sessions */}
            <div className="lg:col-span-2">
              <RecentSessions />
            </div>
            
            {/* Progress Overview */}
            <div className="lg:col-span-1">
              <ProgressOverview />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
