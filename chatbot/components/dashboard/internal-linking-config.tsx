'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Target, Zap, TrendingUp } from 'lucide-react';

type InternalLinkingConfig = {
  scope: 'new_content_only' | 'include_existing' | 'full_site';
  personalizationLevel: 'basic' | 'intermediate' | 'advanced' | 'full';
  conversionFocus: number;
  businessObjectives: string[];
  targetAuthority: number;
  targetConversionRate: number;
  priorityPages: string[];
  excludedPages: string[];
};

type InternalLinkingConfigModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: InternalLinkingConfig;
  onConfigChange: (config: InternalLinkingConfig) => void;
  onSave: () => void;
};



export function InternalLinkingConfigModal({
  open,
  onOpenChange,
  config,
  onConfigChange,
  onSave,
}: InternalLinkingConfigModalProps) {
  const businessObjectives = [
    { id: 'leads', label: 'Lead Generation', icon: Target },
    { id: 'demos', label: 'Demo Requests', icon: Settings },
    { id: 'sales', label: 'Direct Sales', icon: TrendingUp },
    { id: 'signups', label: 'Signups', icon: Zap },
  ];

  const handleObjectiveToggle = (objective: string) => {
    const updatedObjectives = config.businessObjectives.includes(objective)
      ? config.businessObjectives.filter(obj => obj !== objective)
      : [...config.businessObjectives, objective];
    
    onConfigChange({ ...config, businessObjectives: updatedObjectives });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Internal Linking Configuration
          </DialogTitle>
          <DialogDescription>
            Configure how internal linking analysis and optimization should work
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scope Selection */}
          <div className="space-y-3">
            <Label>Analysis Scope</Label>
            <Select
              value={config.scope}
              onValueChange={(value: InternalLinkingConfig['scope']) =>
                onConfigChange({ ...config, scope: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_content_only">New Content Only</SelectItem>
                <SelectItem value="include_existing">Include Existing Content</SelectItem>
                <SelectItem value="full_site">Full Site Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Personalization Level */}
          <div className="space-y-3">
            <Label>Personalization Level</Label>
            <Select
              value={config.personalizationLevel}
              onValueChange={(value: InternalLinkingConfig['personalizationLevel']) =>
                onConfigChange({ ...config, personalizationLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select personalization level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="full">Full Personalization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conversion Focus */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Conversion Focus: {config.conversionFocus}%</Label>
              <Badge variant="outline">
                {config.conversionFocus >= 70 ? 'Conversion-Optimized' : 'SEO-Focused'}
              </Badge>
            </div>
            <Slider
              value={[config.conversionFocus]}
              onValueChange={([value]) =>
                onConfigChange({ ...config, conversionFocus: value })
              }
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>SEO Focused</span>
              <span>Conversion Optimized</span>
            </div>
          </div>

          {/* Business Objectives */}
          <div className="space-y-3">
            <Label>Business Objectives</Label>
            <div className="grid grid-cols-2 gap-2">
              {businessObjectives.map((objective) => {
                const Icon = objective.icon;
                const isSelected = config.businessObjectives.includes(objective.id);
                
                return (
                  <Button
                    key={objective.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className="justify-start h-auto py-3"
                    onClick={() => handleObjectiveToggle(objective.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {objective.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Targets */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Target Authority Score</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.targetAuthority}
                onChange={(e) =>
                  onConfigChange({ ...config, targetAuthority: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-3">
              <Label>Target Conversion Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.targetConversionRate}
                onChange={(e) =>
                  onConfigChange({ ...config, targetConversionRate: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}