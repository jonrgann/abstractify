'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { type DragEvent, useState, useEffect, useRef } from "react";
import { MyUIMessage } from '@/lib/types';
import { TypewriterText } from '@/components/typewrter';
import { Button } from '@/components/ui/button';
import { Loader2Icon, TriangleAlertIcon,  ChartBarBigIcon, EyeIcon, SparklesIcon, SettingsIcon} from 'lucide-react';
import { uploadPdfToSupabase } from '@/lib/supabase/upload';
import { motion, AnimatePresence } from 'motion/react'
import PropertySearch from '@/components/property-search'
import SearchResults from '@/components/search-results';
import NameSearch from '@/components/name-search';
import Order from '@/components/order';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { downloadTitleReportPDF } from '@/components/generateTitleReportPDF';


import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { CopyButton } from '@/components/ui/shadcn-io/copy-button';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

async function convertFilesToDataURLs(
  files: FileList,
): Promise<
  { type: 'file'; filename: string; mediaType: string; url: string }[]
> {
  return Promise.all(
    Array.from(files).map(
      file =>
        new Promise<{
          type: 'file';
          filename: string;
          mediaType: string;
          url: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              type: 'file',
              filename: file.name,
              mediaType: file.type,
              url: reader.result as string
            })
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    ),
  );
}

export default function Page() {

  const { messages, sendMessage } = useChat<MyUIMessage>({
    transport: new DefaultChatTransport({ 
      api: '/api/agent' // Your API route
    }),
  });

  // const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const [isDragging, setIsDragging] = useState(false);
  // const [files, setFiles] = useState<FileList | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {

      const validFiles = Array.from(files)
      const dataTransfer = new DataTransfer();
      validFiles.forEach((file) => dataTransfer.items.add(file));
      // setFiles(dataTransfer.files);

      const dataURLS = await convertFilesToDataURLs(dataTransfer.files);
      sendMessage({ text: '', files: dataURLS});
      // ... your file upload logic
    }
  };  

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    const droppedFilesArray = Array.from(droppedFiles);
    if (droppedFilesArray.length > 0) {
      const validFiles = droppedFilesArray.filter(
        (file) =>
          file.type.startsWith("image/") || file.type === "application/pdf"
      );

      if (validFiles.length === droppedFilesArray.length) {

        const dataTransfer = new DataTransfer();
        validFiles.forEach((file) => dataTransfer.items.add(file));
        // setFiles(dataTransfer.files);

        const dataURLS = await convertFilesToDataURLs(dataTransfer.files);
        sendMessage({ text: '', files: dataURLS});
        // Upload the first valid file immediately
        if (validFiles.length > 0) {
          try {
            const url = await uploadPdfToSupabase(validFiles[0]);
            console.log(url);
            // sendMessage({ text: url },{ body:{ attachmentURL: url, filePart: dataURLS[0]}});
          } catch (error) {
            console.error("Upload failed:", error);
          }
        }
      } else {
        console.log("Only image and PDF files are allowed!");
      }
    }

    setIsDragging(false);
  };

  const handleDownloadPDF = async (data: any) => {
    setIsGenerating(true)
    try {
      // Download PDF directly
      await downloadTitleReportPDF(
        data,
        `Title-Report-${data.orderNumber}.pdf`
      );
      setIsGenerating(false)
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setIsGenerating(false)
    }
  };
  const [isGenerating, setIsGenerating] = useState(false);

  return (

    <div
    className="flex flex-row justify-center h-full flex-1 bg-background"
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    <AnimatePresence>
  {isDragging && (
    <motion.div
      className="fixed inset-0 pointer-events-none dark:bg-zinc-900/90 bg-zinc-100/90 z-50 flex flex-col justify-center items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div>Drag and drop files here</div>
    </motion.div>
  )}
    </AnimatePresence>

            <div className="space-y-8 w-lg mt-4">
              <FieldSeparator>
              {messages.length === 0 ? <Shimmer>Waiting on order...</Shimmer>: `Order Received`}
              </FieldSeparator>
              <Item className="pl-0 mb-4">
              <ItemContent>
                <ItemTitle>Upload Title Order</ItemTitle>
                <ItemDescription>
                  Drag and drop a PDF document.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
              <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf"
                  />
              <Button variant="outline" size="sm" disabled={messages.length != 0} onClick={handleUploadClick}>
                Upload
              </Button>
              </ItemActions>
            </Item>
            {
              messages.map(message =>
                message.parts.map((part, index) => {
                  switch (part.type) {
                    case 'data-workflowReadOrder':
                      return(
                        <Order key={index} orderInfo={part.data.output} status={part.data.status}/>
                      )
                      case 'data-workflowGeneratePropertySearch':
                        return(
                          <PropertySearch  key={index} status={part.data.status} query={part.data.output.queries.length > 0 ? part.data.output.queries[0] : {} } /> 
                        )
                      case 'data-workflowGenerateNameSearch':
                          return(
                            <NameSearch  key={index} status={part.data.status} query={part.data.output.query}/> 
                          )
                      case 'data-workflowSearch':
                          return(
                            <SearchResults  key={index} status={part.data.status} results={part.data.output.results}/> 
                          )
                        case 'data-workflowVesting':
                          return(
                            <div key={index} className="space-y-4">
                              
                                <FieldSeparator>{part.data.status === 'active' ? <Shimmer>Generating Vesting Info...</Shimmer>: `Vesting Info`}</FieldSeparator>
                                {part.data.output && (
                                <FieldSet className="mt-8">
                                <FieldGroup>
                                  <Field>
                                  <div className="grid grid-cols-[1fr_auto] gap-4">
                                  <FieldLabel htmlFor="current-owner">
                                    Current Owner
                                  </FieldLabel>
                                  <CopyButton content={ part.data.output.name} variant="outline" size="sm" />
                                  </div>
                                    <Textarea
                                      id="current-owner"
                                      className="resize-none"
                                      defaultValue={part.data.output.name}
                                    />
                                  </Field>
                                </FieldGroup>
                              </FieldSet>
                                )}
                            </div>
                          )
                          case 'data-workflowResearchComplete':
                            return (
                              <div key={index} className="w-full">
                                <FieldSeparator>Research Complete</FieldSeparator>
                                    <div className="mt-8 grid grid-cols-[1fr_1fr] gap-4">
                                      <Button
                                          onClick={() => handleDownloadPDF(part.data.output)}
                                          disabled={isGenerating} 
                                        >
                                          {isGenerating ? (
                                            <Loader2Icon className="animate-spin h-5 w-5" /> 
                                          ) : (
                                            <ChartBarBigIcon className="h-5 w-5" /> 
                                          )}
                                          {isGenerating ? "Downloading..." : "Download Report"}
                                        </Button>
                                      <a href={'https://portal.propertysync.com/orders/'} target="_blank"><Button variant={'outline'} className="w-full"><EyeIcon/>View in Propertysync</Button></a>
                                    </div>
                          
                             </div>
                            );
                            case 'data-workflowError':
                              return (
                                <div key={index}>
                                  <FieldSeparator>Error</FieldSeparator>
                                  <div className="mt-8">
                                  <span className="text-rose-400">{part.data.output}</span>
                                  </div>
                                </div>
                              )
                    default:
                      return null;
                  }
                })
              )
            }

          
          <div ref={messagesEndRef} />
          </div>
           </div>   
  );
}

