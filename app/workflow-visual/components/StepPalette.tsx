'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { getStepCategories } from '../lib/step-metadata';
import { StepMetadata } from '../types/visual-workflow';

function DraggableStepItem({ step }: { step: StepMetadata }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${step.functionName}`,
    data: {
      type: 'palette-step',
      stepFunction: step.functionName
    }
  });

  return (
    <div ref={setNodeRef}>
      <Card
        className={`p-3 cursor-grab active:cursor-grabbing hover:border-primary transition-colors ${
          isDragging ? 'opacity-50' : ''
        }`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium mb-0.5">{step.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {step.description}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function StepPalette() {
  const [searchQuery, setSearchQuery] = useState('');
  const categories = getStepCategories();

  // Filter steps by search query
  const filteredCategories = categories
    .map(category => ({
      ...category,
      steps: category.steps.filter(step =>
        step.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        step.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        step.functionName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => category.steps.length > 0);

  return (
    <div className="h-full flex flex-col bg-secondary/30 border-r">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <h2 className="text-lg font-semibold mb-3">Step Palette</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Step List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {filteredCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No steps found matching &quot;{searchQuery}&quot;
            </p>
          ) : (
            filteredCategories.map(category => (
              <div key={category.id}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.steps.map(step => (
                    <DraggableStepItem key={step.functionName} step={step} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Help Text */}
      <div className="p-4 border-t bg-background">
        <p className="text-xs text-muted-foreground">
          Drag steps to the canvas to build your workflow
        </p>
      </div>
    </div>
  );
}
