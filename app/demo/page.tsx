'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { type DragEvent, useState, useEffect, useRef } from "react";
import { MyUIMessage } from '@/lib/types';
import { TypewriterText } from '@/components/typewrter';
import { Button } from '@/components/ui/button';
import { Loader2Icon, TriangleAlertIcon,  ChartBarBigIcon, EyeIcon, SparklesIcon} from 'lucide-react';
import { uploadPdfToSupabase } from '@/lib/supabase/upload';
import { motion, AnimatePresence } from 'motion/react'
import { Hero } from '@/components/hero';
import { CodeBlock } from '@/components/ai-elements/code-block';
import { Workflow } from '@/components/workflow';
import PropertySearch from '@/components/property-search'
import NameSearch from '@/components/name-search';
import Order from '@/components/order';


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

async function convertFilesToDataURLs(
  files: FileList,
): Promise<
  { type: 'file'; filename: string; mediaType: string; data: string }[]
> {
  return Promise.all(
    Array.from(files).map(
      file =>
        new Promise<{
          type: 'file';
          filename: string;
          mediaType: string;
          data: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            // resolve({
            //   type: 'file',
            //   filename: file.name,
            //   mediaType: file.type,
            //   url: reader.result as string, // Data URL
            // });
            resolve({
              type: 'file',
              filename: file.name,
              mediaType: file.type,
              data: reader.result as string
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
      api: '/api/research' // Your API route
    }),
  });

  // const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const [isDragging, setIsDragging] = useState(false);
  // const [files, setFiles] = useState<FileList | null>(null);


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
      sendMessage({ text: '' },{ body:{ filePart: dataURLS[0]}});
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

const [isGenerating, setIsGenerating] = useState(false)
const generatePDF = async (data: any) => {
  setIsGenerating(true)
  console.log(data)
  try {
    const response = await fetch(`/api/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({data:data}),
    })

    if (!response.ok) {
      console.log(response)
      throw new Error("Failed to generate PDF")
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Title-Report-${data.orderInfo.orderNumber}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("Failed to generate PDF")
  } finally {
    setIsGenerating(false)
  }
}
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
    <div className="min-w-lg w-5xl mt-10">
    <Hero />
    <div className="space-y-4">


    <AnimatePresence>
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      exit={{ opacity: 0 }}
    >
    <Card className="gap-0">
      <CardHeader>
        <CardTitle icon={<SparklesIcon className="w-5 h-5 text-muted-foreground/80"/>}>
        <TypewriterText text='Drag and drop a title order to get started.' delay={1000} speed={20}/>
        </CardTitle>
      </CardHeader>
    </Card>
    </motion.div>

    </AnimatePresence>



    

 
{
  messages.map(message =>
    message.parts.map((part, index) => {
      switch (part.type) {

        case 'data-workflowReadOrder':
          return(
            <Order key={index} orderInfo={part.data.output} status={part.data.status}/>
          )

          case 'data-workflowConnectPropertysync':
            return (
              <Workflow key={index} {...part.data}>
              {part.data.output && (
                <div className="flex-col flex text-muted-foreground">
                    <TypewriterText text={`${part.data.output.name}`} delay={0}/>
                    <TypewriterText text={`Effective Date: ${part.data.output.effectiveDate}`} delay={200 * 1}/>
                </div>
              )}
              </Workflow>
            );

            case 'data-workflowGeneratePropertySearch':
              return (
                <div key={index}>
                { part.data.output && (
                  <div className="flex-col flex text-muted-foreground">
                      {part.data.output.queries.map((query:any, rowIndex:number) => {
                          return (
                            <PropertySearch  key={rowIndex} status={part.data.status} query={query} results={part.data.output.results}/> 
                          );
                        })}
                  </div>
                )}
                </div>
              );

              case 'data-workflowGenerateNameSearch':
                return (
                  <div key={index}>
                  { part.data.output && (
                    <div className="flex-col flex text-muted-foreground space-y-4">
                         <NameSearch status={part.data.status} query={part.data.output.query} results={part.data.output.results}/> 
                    </div>
                  )}
                  </div>
                );

          case 'data-workflowSummarize':
            return (
              <Workflow key={index} {...part.data}>
              {part.data.output && (
                <div className="flex-col flex text-muted-foreground">
                    {part.data.output.summary}
                </div>
              )}
              </Workflow>
            );

            case 'data-workflowVesting':
              return (
                <Workflow key={index} {...part.data}>
                {part.data.output && (
                  <div className="flex-col flex text-muted-foreground">
                    <TypewriterText text={part.data.output.names} delay={0}/>
                    {/* <TypewriterText text={`Date Acquired: ${part.data.output.dateAcquired}`} delay={200 * 1}/>
                    <TypewriterText text={`Document Number: ${part.data.output.documentNumber}`} delay={300 * 1}/> */}
                  </div>
                )}
                </Workflow>
              );

                case 'data-workflowResearchComplete':
                  return (
                    <Workflow key={index} {...part.data}>
                    {part.data.output && (
                      <div className="flex-col flex text-muted-foreground">
                          <div className="mt-2 flex gap-4">
                            <Button
                                onClick={() => generatePDF(part.data.output)}
                                disabled={isGenerating} 
                              >
                                {isGenerating ? (
                                  <Loader2Icon className="animate-spin h-5 w-5" /> 
                                ) : (
                                  <ChartBarBigIcon className="h-5 w-5" /> 
                                )}
                                {isGenerating ? "Downloading..." : "Download Report"}
                              </Button>
                            <a href={'https://portal.propertysync.com/orders/'} target="_blank"><Button variant={'outline'}><EyeIcon/>View in Propertysync</Button></a>
                            </div>
                      </div>
                    )}
                    </Workflow>
                  );
        /* ---------------- Read Order Sheet -------------------- */

        case 'data-error':
          return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    exit={{ opacity: 0 }}
                  >
                  <Card className="gap-0">
                    <CardHeader>
                      <CardTitle icon={<TriangleAlertIcon className="w-5 h-5 text-muted-foreground/80"/>}>
                      <TypewriterText text={part.data.message} delay={500}/>
                      </CardTitle>
                      <CardContent>
                        <CodeBlock code={part.data.message} language={'json'}/>
                      </CardContent>
                    </CardHeader>
                  </Card>
                  </motion.div>
          );
        default:
          return null;
      }
    })
  )
}
<div ref={messagesEndRef} />
</div>

    </div>
    </div>
  );
}

