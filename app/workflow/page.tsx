'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const QUERIES = [
  {
    value: 'generate a title report on lot 98 yorktown subdivision phase 1',
    name: 'generate a title report on lot 98 yorktown subdivision phase 1',
  },
];

export default function Home() {
  const [query, setQuery] = useState(QUERIES[0].value);
  const [success, setSuccess] = useState(false);

  const onSubmit = async () => {
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        setSuccess(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative w-full h-[700px] bg-background pt-20">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight text-balance">
          Email Reports
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Abstractify + PropertySync
        </p>

        <div className="mt-10 mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <Select
              defaultValue={QUERIES[0].value}
              onValueChange={setQuery}
              value={query}
            >
              <SelectTrigger className="h-11 w-full rounded-full bg-secondary text-secondary-foreground px-5">
                <SelectValue placeholder="Select a pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {QUERIES.map((query) => (
                    <SelectItem key={query.name} value={query.value}>
                      {query.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full px-4 shadow-none"
              onClick={onSubmit}
            >
              Run
            </Button>
          </div>
        </div>

        {success && (
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            Workflow triggered — check server logs.
          </p>
        )}
      </div>
    </div>
  );
}
