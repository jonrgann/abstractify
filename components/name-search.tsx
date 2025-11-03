import React from 'react';

// Shadcn UI components
import {
  Card,
  CardContent
} from '@/components/ui/card';

import { LoaderIcon } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"

import { Shimmer } from './ai-elements/shimmer';
import { motion, AnimatePresence } from 'motion/react'

// PropertySearch Props Interface
interface NameSearchProps {
  query: { 
    name?: string,
    startDate?: string,
    endDate?: string
 }
  status: 'active'| 'pending' | 'complete' | 'failed';
}

const NameSearch: React.FC<NameSearchProps> = ({
    query,
    status = 'active',
  }) => {
    return (
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <FieldSeparator>
      {status === 'active' ? <Shimmer>Generating Searches...</Shimmer>: `Name Search`}
      </FieldSeparator>
      <AnimatePresence>
  {status === 'complete' && (
    <motion.div 
      className="w-full mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form>
    <FieldSet>
      {/* <FieldLegend>{status === 'active' ? 'Generating Property Search...' : 'Property Search'}</FieldLegend>
      <FieldDescription>{status === 'active' ? 'Reviewing legal descriptions...' : 'Generated search query from order'}</FieldDescription> */}
<FieldGroup>
  <div className="grid grid-cols-[1fr_auto_auto] gap-4">
    <Field>
      <FieldLabel htmlFor="lot">Name</FieldLabel>
        <Input id="name" placeholder='None' defaultValue={query.name ?? ''} />
    
    </Field>
    <Field className='w-[150px]'>
      <FieldLabel htmlFor="block">Start Date</FieldLabel>
        <Input id="startDate" placeholder='None' defaultValue={query.startDate ?? ''} />
    </Field>
    <Field className='w-[150px]'>
      <FieldLabel htmlFor="addition">End Date</FieldLabel>
        <Input id="endDate" placeholder='None' defaultValue={query.endDate ?? ''} />
   
    </Field>
  </div>
</FieldGroup>
    </FieldSet>
    </form>
    </motion.div>
  )}
</AnimatePresence>
  </motion.div>
    );
  };

  export default NameSearch;