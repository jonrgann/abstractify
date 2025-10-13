import React from 'react';
import { Loader2 } from 'lucide-react';

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
  InputGroupText,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

import { Separator } from './ui/separator';


import { motion, AnimatePresence } from 'motion/react'

// PropertySearch Props Interface
interface OrderProps {
  orderInfo?: { 
    orderNumber? :string,
    propertyAddress?: string,
    county?: string,
    sellers?: string,
    borrowers?: string,
    legalDescription?: string
 },
  status: 'active'| 'pending' | 'complete' | 'failed';
}

const Order: React.FC<OrderProps> = ({
    orderInfo,
    status = 'active',

  }) => {
    return (
        <Card className={status === 'active' ? 'animate-pulse' : ''}>
        <CardContent className="space-y-4">
        <FieldSet>
            {/* <FieldLegend>{status === 'active' ? 'Reading Order...' : 'Order Information'}</FieldLegend> */}
            {/* <FieldDescription>{status === 'active' ? 'Reviewing legal descriptions...' : 'Generated search query from order'}</FieldDescription> */}
            <FieldGroup>
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="orderNumber">Order Number</FieldLabel>
                  <InputGroup data-disabled>
                    <InputGroupInput id="orderNumber" placeholder={ status === 'active' ? 'Thinking...' : 'None'} disabled value={orderInfo?.orderNumber ?? ''} />
                    {(status === 'active' && !orderInfo?.orderNumber) && (
                      <InputGroupAddon>
                        <LoaderIcon className="animate-spin w-4 h-4" />
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="propertyAddress">Property Address</FieldLabel>
                  <InputGroup data-disabled>
                    <InputGroupInput id="propertyAddress" placeholder={ status === 'active' ? 'Reviewing...' : 'None'} disabled value={orderInfo?.propertyAddress ?? ''} />
                    {(status === 'active' && !orderInfo?.propertyAddress) && (
                      <InputGroupAddon>
                        <LoaderIcon className="animate-spin w-4 h-4" />
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="legalDescription">Legal Description</FieldLabel>
                  <InputGroup data-disabled>
                    <InputGroupInput id="legalDescription" placeholder={ status === 'active' ? 'Analyzing...' : 'None'} disabled value={orderInfo?.legalDescription ?? ''} />
                    {(status === 'active' && !orderInfo?.legalDescription) && (
                      <InputGroupAddon>
                        <LoaderIcon className="animate-spin w-4 h-4" />
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
    );
  };
  
  export default Order;