'use client';

import { useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { format } from 'date-fns';

export function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[280px] justify-start text-left font-normal"
        >
          <FiCalendar className="mr-2 h-4 w-4" />
          {value.start ? (
            value.end ? (
              <>
                {format(value.start, 'MMM dd, yyyy')} -{' '}
                {format(value.end, 'MMM dd, yyyy')}
              </>
            ) : (
              format(value.start, 'MMM dd, yyyy')
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="range"
          selected={value}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange(range);
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}