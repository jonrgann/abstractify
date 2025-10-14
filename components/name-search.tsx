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
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"

import {
    Table,
    TableBody,
    TableCell,
    TableRow,
  } from "@/components/ui/table"

import { motion } from 'motion/react'

// PropertySearch Props Interface
interface NameSearchProps {
  query: { 
    name?: string,
    startDate?: string,
    endDate?: string
 }
  status: 'active'| 'pending' | 'complete' | 'failed';
  results?: any
}

const NameSearch: React.FC<NameSearchProps> = ({
    query,
    status = 'active',
    results
  }) => {
    return (
        <Card className={status === 'active' ? 'animate-pulse' : ''}>
        <CardContent className="space-y-4">
        <FieldSet>
            {/* <FieldLegend>{status === 'active' ? 'Generating Name Search...' : 'Name Search'}</FieldLegend>
            <FieldDescription>{status === 'active' ? 'Reviewing documents...' : 'Generated search query from order'}</FieldDescription> */}
            <FieldGroup>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4">
                <Field>
                  <FieldLabel htmlFor="name">Name Search</FieldLabel>
                  <InputGroup data-disabled>
                    <InputGroupInput id="name" placeholder={(status === 'active' && !query.name) ? '' : 'None'} disabled value={query.name ?? ''} />
                    {(status === 'active' && !query.name) && (
                      <InputGroupAddon>
                        <LoaderIcon className="animate-spin w-4 h-4" />
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Field>
                <Field className='w-[150px]'>
                  <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
                  <InputGroup data-disabled>
                    <InputGroupInput id="startDate" placeholder={(status === 'active' && !query.name) ? '' : 'None'} disabled value={query.startDate ?? ''} />
                    {(status === 'active' && !query.name) && (
                      <InputGroupAddon>
                        <LoaderIcon className="animate-spin w-4 h-4" />
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Field>
                <Field className='w-[150px]'>
                  <FieldLabel htmlFor="endDate">End Date</FieldLabel>
                  <InputGroup data-disabled>
                    <InputGroupInput id="endDate" placeholder={(status === 'active' && !query.name) ? '' : 'None'} disabled value={query.endDate ?? ''} />
                    {(status === 'active' && !query.name) && (
                      <InputGroupAddon>
                        <LoaderIcon className="animate-spin w-4 h-4" />
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
          {results && (
                    <div className="flex-col flex text-muted-foreground mt-4">
                        <Table className="overflow-hidden mt-1">
                        <TableBody>
                            {results.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground text-base">
                                  No documents found
                                </TableCell>
                              </TableRow>
                            ) : (
                            results.map((doc:any, rowIndex:number) => {
                                return (
                                  <motion.tr
                                    key={rowIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.4,
                                      delay: rowIndex * 0.1,
                                      ease: "easeOut"
                                    }}
                                    className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors text-base"
                                  >
                                    <TableCell className="w-[100px] font-medium">{doc.documentNumber}</TableCell>
                                    <TableCell className="w-[100px]">{doc.filedDate}</TableCell>
                                    <TableCell className="max-w-[150px] truncate">{doc.documentType}</TableCell>
                                    <TableCell className="max-w-[150px] truncate">{doc.grantor}</TableCell>
                                    <TableCell className="max-w-[150px]  truncate">{doc.grantor}</TableCell>
                                  </motion.tr>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                    </div>
                  )}
        </CardContent>
      </Card>
    );
  };
  
  export default NameSearch;