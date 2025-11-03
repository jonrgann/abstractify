import React from 'react';

import {
  Card,
  CardContent
} from '@/components/ui/card';

import { LoaderIcon, FileText, BadgeCheckIcon } from "lucide-react"
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

import {
    Table,
    TableBody,
    TableCell,
    TableRow,
  } from "@/components/ui/table"

  import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
  } from "@/components/ui/item"
import { Separator } from './ui/separator';

import { motion, AnimatePresence } from 'motion/react'
import { Shimmer } from './ai-elements/shimmer';
// PropertySearch Props Interface
interface SearchResultsProps {
  status: 'active'| 'pending' | 'complete' | 'failed',
  results?: any
}

const SearchResults: React.FC<SearchResultsProps> = ({
    results,
    status
  }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <FieldSeparator>
          {status === 'active' ? <Shimmer>Running Search...</Shimmer> : `Found ${results.length} Documents`}
        </FieldSeparator>
        <AnimatePresence>
          {status === 'complete' && (
            <motion.div 
              className="w-full mt-8 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {results && (
                <>
                  {results.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Item variant="outline" size="sm" asChild>
                        <div>
                          <ItemMedia>
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle></ItemTitle>
                          </ItemContent>
                          <ItemActions>
                            {/* <ChevronRightIcon className="size-4" /> */}
                          </ItemActions>
                          </div>
                      </Item>
                    </motion.div>
                  ) : (
                    results.map((doc: any, rowIndex: number) => {
                      return (
                        <motion.div
                          key={rowIndex}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.3,
                            delay: rowIndex * 0.1,
                            ease: "easeOut"
                          }}
                        >
                          <Item variant="outline" className="dark:bg-input/30" size="sm" asChild>
                            <div>
                              <ItemMedia>
                                <FileText className="size-5 text-muted-foreground/50" />
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>
                                  <div className="flex h-5 items-center space-x-4 text-sm">
                                    <div>{doc.filedDate}</div>
                                    <Separator orientation="vertical" />
                                    <div>{doc.documentType}</div>
                                    <Separator orientation="vertical" />
                                    <div>{doc.documentNumber}</div>
                                  </div>
                                </ItemTitle>
                              </ItemContent>
                              <ItemActions>
                                {/* <ChevronRightIcon className="size-4" /> */}
                              </ItemActions>
                            </div>
                          </Item>
                        </motion.div>
                      );
                    })
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };
  export default SearchResults;