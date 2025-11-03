import React from 'react';

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
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"

import { motion, AnimatePresence } from 'motion/react'
import { Shimmer } from './ai-elements/shimmer';
// PropertySearch Props Interface
interface PropertySearchProps {
  query: { 
    lot? :string,
    block?: string,
    addition?: string,
    startDate?: string,
    endDate?: string
 }
  status: 'active'| 'pending' | 'complete' | 'failed',
  results?: any
}

const PropertySearch: React.FC<PropertySearchProps> = ({
    query,
    status = 'active',
    results
  }) => {
    return (
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <FieldSeparator>
      {status === 'active' ? <Shimmer>Generating Searches...</Shimmer>: `Property Search`}
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
  <div className="grid grid-cols-[auto_auto_1fr] gap-4">
    <Field className='w-[80px]'>
      <FieldLabel htmlFor="lot">Lot</FieldLabel>

        <Input id="lot" placeholder='None' defaultValue={query.lot ?? ''} />
      
    </Field>
    <Field className='w-[80px]'>
      <FieldLabel htmlFor="block">Block</FieldLabel>
        <Input id="block" placeholder='None' defaultValue={query.block ?? ''} />
    </Field>
    <Field>
      <FieldLabel htmlFor="addition">Addition</FieldLabel>
        <Input id="addition" placeholder='None' defaultValue={query.addition ?? ''} />
   
    </Field>
  </div>
  <div className="grid grid-cols-[1fr_1fr] gap-4">
    <Field >
      <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
        <Input id="startDate" placeholder='None' defaultValue={query.startDate ?? ''} />
    </Field>
    <Field >
      <FieldLabel htmlFor="endDate">End Date</FieldLabel>
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
  
  export default PropertySearch;