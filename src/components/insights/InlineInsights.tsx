import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, MapPin, Globe, RefreshCw } from "lucide-react";
import { getInline, type InlineInsight } from "@/lib/api/insights";

interface InlineInsightsProps {
  questionId: string;
  myCity?: string;
  myState?: string;
  myCountry?: string;
}

const STANCE_LABELS = {
  '-2': 'Strongly Against',
  '-1': 'Against',
  '0': 'Neutral',
  '1': 'For',
  '2': 'Strongly For'
};

export default function InlineInsights({ questionId, myCity, myState, myCountry }: InlineInsightsProps) {
  const [insights, setInsights] = useState<Record<string, InlineInsight>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'city' | 'state' | 'country' | 'global'>('global');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const tabs = [
    { key: 'city' as const, label: 'My City', icon: MapPin, region: myCity, enabled: !!myCity },
    { key: 'state' as const, label: 'My State', icon: MapPin, region: myState, enabled: !!myState },
    { key: 'country' as const, label: 'My Country', icon: MapPin, region: myCountry, enabled: !!myCountry },
    { key: 'global' as const, label: 'Global', icon: Globe, region: undefined, enabled: true },
  ].filter(tab => tab.enabled);

  const loadInsight = async (regionLevel: typeof activeTab, regionKey?: string) => {
    const key = `${regionLevel}-${regionKey || 'global'}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const insight = await getInline({
        questionId,
        regionLevel,
        regionKey,
      });
      setInsights(prev => ({ ...prev, [key]: insight }));
    } catch (error) {
      console.error(`Error loading ${regionLevel} insights:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Load initial insights
  useEffect(() => {
    tabs.forEach(tab => {
      loadInsight(tab.key, tab.region);
    });
  }, [questionId, myCity, myState, myCountry]);

  // Set up refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      tabs.forEach(tab => {
        loadInsight(tab.key, tab.region);
      });
    }, 60000); // 60 seconds

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [questionId, myCity, myState, myCountry]);

  const renderDistribution = (insight: InlineInsight) => {
    const total = insight.sample_size;
    if (total === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No data available</p>
        </div>
      );
    }

    const maxCount = Math.max(...Object.values(insight.distribution));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sample Size: {total}
          </span>
          <span className="text-muted-foreground">
            Updated: {new Date(insight.updated_at).toLocaleTimeString()}
            {insight.cached && <Badge variant="outline" className="ml-2">Cached</Badge>}
          </span>
        </div>

        <div className="space-y-3">
          {Object.entries(STANCE_LABELS).map(([score, label]) => {
            const count = insight.distribution[score] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={score} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{count}</span>
                    <span className="font-mono text-xs min-w-[3rem] text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sparkline placeholder */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Trend</span>
            <Badge variant="outline" className="text-xs">
              Coming Soon
            </Badge>
          </div>
          <div className="h-8 bg-muted rounded mt-2 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-muted-foreground opacity-50" />
          </div>
        </div>
      </div>
    );
  };

  const getCurrentInsight = (): InlineInsight | null => {
    const currentTab = tabs.find(tab => tab.key === activeTab);
    if (!currentTab) return null;
    
    const key = `${activeTab}-${currentTab.region || 'global'}`;
    return insights[key] || null;
  };

  const isCurrentLoading = (): boolean => {
    const currentTab = tabs.find(tab => tab.key === activeTab);
    if (!currentTab) return false;
    
    const key = `${activeTab}-${currentTab.region || 'global'}`;
    return loading[key] || false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Live Stance Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          value={activeTab} 
          onValueChange={(tab) => setActiveTab(tab as typeof activeTab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.key} 
                  value={tab.key}
                  className="flex items-center gap-1"
                  aria-selected={activeTab === tab.key}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="mt-6">
              {isCurrentLoading() ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div aria-live="polite" aria-label="Stance distribution data">
                  {getCurrentInsight() ? renderDistribution(getCurrentInsight()!) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Loading insights...</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}