// ============================================
// DISPATCH NG - Admin Dashboard Page
// ============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, ClipboardCheck, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/utils/format';

interface DashboardStats {
  totalUsers: number;
  totalRiders: number;
  totalJobs: number;
  pendingVerifications: number;
  openDisputes: number;
  platformRevenue: number;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRiders: 0,
    totalJobs: 0,
    pendingVerifications: 0,
    openDisputes: 0,
    platformRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: totalUsers },
        { count: totalRiders },
        { count: totalJobs },
        { count: pendingVerifications },
        { count: openDisputes },
        { data: completedJobs },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('rider_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('dispatch_jobs').select('*', { count: 'exact', head: true }),
        supabase.from('rider_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
        supabase.from('dispatch_jobs').select('platform_fee').eq('status', 'completed'),
      ]);

      const platformRevenue = completedJobs?.reduce((sum, job) => sum + (job.platform_fee || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalRiders: totalRiders || 0,
        totalJobs: totalJobs || 0,
        pendingVerifications: pendingVerifications || 0,
        openDisputes: openDisputes || 0,
        platformRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500', link: '/admin/riders' },
    { label: 'Total Riders', value: stats.totalRiders, icon: Package, color: 'bg-violet-500', link: '/admin/riders' },
    { label: 'Total Jobs', value: stats.totalJobs, icon: TrendingUp, color: 'bg-green-500', link: '/admin/jobs' },
    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: ClipboardCheck, color: 'bg-amber-500', link: '/admin/verifications' },
    { label: 'Open Disputes', value: stats.openDisputes, icon: AlertTriangle, color: 'bg-red-500', link: '/admin/disputes' },
    { label: 'Platform Revenue', value: formatCurrency(stats.platformRevenue), icon: DollarSign, color: 'bg-emerald-500', link: '/admin/jobs' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-xl`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/admin/verifications" className="block p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                <p className="font-medium text-amber-900">Review Pending Verifications</p>
                <p className="text-sm text-amber-700">{stats.pendingVerifications} riders waiting for approval</p>
              </Link>
              <Link to="/admin/disputes" className="block p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <p className="font-medium text-red-900">Resolve Disputes</p>
                <p className="text-sm text-red-700">{stats.openDisputes} open disputes</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">System Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Auth Service</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
