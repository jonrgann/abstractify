'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { TemplateVariable } from '../types/visual-workflow';
import { filterTemplateVariables, getSuggestedVariables } from '../hooks/useTemplateVariables';

interface TemplateVariableInputProps {
  value: string;
  onChange: (value: string) => void;
  availableVariables: TemplateVariable[];
  placeholder?: string;
  parameterName?: string;
  className?: string;
}

export function TemplateVariableInput({
  value,
  onChange,
  availableVariables,
  placeholder,
  parameterName,
  className
}: TemplateVariableInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect if cursor is inside {{ }}
  const detectTemplateContext = (text: string, position: number) => {
    const beforeCursor = text.slice(0, position);
    const lastOpenBrace = beforeCursor.lastIndexOf('{{');
    const lastCloseBrace = beforeCursor.lastIndexOf('}}');

    // Cursor is inside {{ }} if last {{ is after last }}
    if (lastOpenBrace > lastCloseBrace) {
      const query = beforeCursor.slice(lastOpenBrace + 2);
      setSearchQuery(query);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    const position = inputRef.current?.selectionStart || 0;
    setCursorPosition(position);
    detectTemplateContext(newValue, position);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Update cursor position on arrow keys
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      const position = inputRef.current?.selectionStart || 0;
      setCursorPosition(position);
      detectTemplateContext(value, position);
    }
  };

  const handleSelect = (variable: TemplateVariable) => {
    if (!inputRef.current) return;

    const position = cursorPosition;
    const beforeCursor = value.slice(0, position);
    const afterCursor = value.slice(position);

    // Find the position of {{ before cursor
    const lastOpenBrace = beforeCursor.lastIndexOf('{{');

    // Replace from {{ to cursor with the selected variable
    const newValue =
      value.slice(0, lastOpenBrace) +
      `{{${variable.path}}}` +
      afterCursor;

    onChange(newValue);
    setShowSuggestions(false);

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Filter and sort suggestions
  const suggestions = searchQuery
    ? filterTemplateVariables(availableVariables, searchQuery)
    : getSuggestedVariables(availableVariables, parameterName);

  return (
    <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyUp={handleKeyUp}
            placeholder={placeholder || "Type {{ to insert variables"}
            className={className}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-80"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandEmpty>No variables found.</CommandEmpty>
            <CommandGroup heading="Available Variables">
              {suggestions.slice(0, 10).map((variable) => (
                <CommandItem
                  key={variable.path}
                  value={variable.path}
                  onSelect={() => handleSelect(variable)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <code className="text-sm font-mono">
                      {`{{${variable.path}}}`}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {variable.type === 'config' ? 'Global config' : `From step: ${variable.stepName}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
