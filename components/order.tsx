import React from 'react';

// Shadcn UI components
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { LoaderIcon } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"

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
import { Shimmer } from '@/components/ai-elements/shimmer';
import { motion,AnimatePresence } from 'motion/react'
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
  status: 'active'| 'pending' | 'complete' | 'failed'
}

const Order: React.FC<OrderProps> = ({
    orderInfo,
    status,

  }) => {

    return (
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <FieldSeparator>
      {status === 'active' ? <Shimmer>Reading order...</Shimmer>: `Order Information`}
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
        <FieldGroup>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          >
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="file-number">
                    File Number
                  </FieldLabel>
                  <Input
                    id="file-number"
                    placeholder="XX-XXXX"
                    required
                    defaultValue={orderInfo?.orderNumber}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="property-address">
                    Property Address
                  </FieldLabel>
                  <Input
                    id="property-address"
                    placeholder="123 ABC Dr"
                    required
                    defaultValue={orderInfo?.propertyAddress}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          >
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="legal-description">
                    Legal Description
                  </FieldLabel>
                  <Textarea
                    id="legal-description"
                    placeholder="Add the legal description for the property."
                    className="resize-none"
                    defaultValue={orderInfo?.legalDescription}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
          </motion.div>
        </FieldGroup>
      </form>
    </motion.div>
  )}
</AnimatePresence>
      </motion.div>
    );
  };
  
  export default Order;