import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getPersonalAnalytics, transformForTimeSeriesChart, type PersonalAnalytics, type StanceTimePoint } from '@/features/analytics/personal';

const Analytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<PersonalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth/signup');
      return;
    }
    setUser(user);
    await loadAnalytics();
  };

  const loadAnalytics = async () => {
    try {
      const data = await getPersonalAnalytics();
      setAnalytics(data);
      
      // Transform data for charts
      const transformed = transformForTimeSeriesChart(data.stanceHistory);
      setChartData(transformed);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const formatPercentage = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${absValue.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading your analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalStances === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mr-4"
            aria-label="Go back to home"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Personal Analytics</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              You haven't taken any stances yet. Visit the feed to start engaging with questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/feed')}>
              Go to Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mr-4"
          aria-label="Go back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Personal Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Stances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStances}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Questions you've engaged with
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Weekly Change
              {getTrendIcon(analytics.weeklyChange)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analytics.weeklyChange)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs previous 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Monthly Change
              {getTrendIcon(analytics.monthlyChange)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analytics.monthlyChange)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs previous 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stance Timeline Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Stance Timeline</CardTitle>
          <CardDescription>
            Your average stance score over time (scale: -2 to +2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full" role="img" aria-label="Stance timeline chart showing your opinion changes over time">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  domain={[-2, 2]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}`, 
                    'Average Score'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Chart shows daily average of your stance scores. Sample size varies by date.
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Table Stub */}
      <Card>
        <CardHeader>
          <CardTitle>All Past Responses</CardTitle>
          <CardDescription>
            Your complete stance history with filters and editing options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filter Controls Stub */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
              <Badge variant="outline">Filter by Topic (Coming Soon)</Badge>
              <Badge variant="outline">Filter by Date Range (Coming Soon)</Badge>
            </div>

            {/* Sample Table Data */}
            <div className="space-y-2">
              {analytics.stanceHistory.slice(0, 5).map((stance, index) => (
                <div 
                  key={`${stance.question_id}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {stance.question_title || `Question ${stance.question_id.slice(0, 8)}...`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(stance.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      stance.score > 0 ? 'default' : 
                      stance.score < 0 ? 'destructive' : 
                      'secondary'
                    }>
                      Score: {stance.score > 0 ? '+' : ''}{stance.score}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/question/${stance.question_id}`)}
                      aria-label={`Edit stance for question: ${stance.question_title || stance.question_id}`}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {analytics.totalStances > 5 && (
              <div className="text-center pt-4">
                <Badge variant="outline">
                  Showing 5 of {analytics.totalStances} total responses
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;