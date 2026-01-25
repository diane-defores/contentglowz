'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'quick' | 'medium' | 'long';
  category: string;
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
  onActionClick?: (id: string) => void;
}

export function RecommendationsList({
  recommendations,
  onActionClick,
}: RecommendationsListProps) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'quick':
        return <Zap className="h-4 w-4 text-green-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'long':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getEffortLabel = (effort: string) => {
    switch (effort) {
      case 'quick':
        return 'Quick win';
      case 'medium':
        return '2-4 weeks';
      case 'long':
        return '1-2 months';
      default:
        return effort;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Recommended Actions</h3>
          <p className="text-sm text-muted-foreground">
            Prioritized improvements to boost your topical authority
          </p>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <Badge
                      variant="secondary"
                      className={getImpactColor(rec.impact)}
                    >
                      {rec.impact} impact
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {rec.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {getEffortIcon(rec.effort)}
                      <span className="text-muted-foreground">
                        {getEffortLabel(rec.effort)}
                      </span>
                    </div>
                    <Badge variant="outline">{rec.category}</Badge>
                  </div>
                </div>

                {onActionClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onActionClick(rec.id)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
