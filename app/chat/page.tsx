'use client';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
    PromptInput,
    PromptInputActionAddAttachments,
    PromptInputActionMenu,
    PromptInputActionMenuContent,
    PromptInputActionMenuTrigger,
    PromptInputAttachment,
    PromptInputAttachments,
    PromptInputBody,
    PromptInputButton,
    PromptInputHeader,
    type PromptInputMessage,
    PromptInputSelect,
    PromptInputSelectContent,
    PromptInputSelectItem,
    PromptInputSelectTrigger,
    PromptInputSelectValue,
    PromptInputSpeechButton,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputFooter,
    PromptInputTools,
  } from '@/components/ai-elements/prompt-input';
  import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
  } from '@/components/ai-elements/reasoning';
  import {
    Tool,
    ToolContent,
    ToolHeader,
    ToolInput,
    ToolOutput,
  } from "@/components/ai-elements/tool";
import { useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { getToolName, isToolUIPart } from 'ai';
import { ResearchAgentUIMessage } from '@/lib/agents/researchAgent';
import { GlobeIcon, FileText, ChevronRightIcon, Workflow, FileTextIcon} from 'lucide-react';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { TypewriterText } from '@/components/typewrter';
import { motion, AnimatePresence } from 'motion/react'
import { Separator } from '@/components/ui/separator';
import { WorkflowChatTransport } from "@workflow/ai";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

import { Fragment, } from 'react';

import { CopyIcon, RefreshCcwIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';

import { MessageSquare, ShieldAlertIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Loader } from '@/components/ai-elements/loader';

const suggestions = [
  'Can I get the plat for Huntington Hills Lot 19 Block 2',
];

const counties = [
    { id: '54766f37-bfad-4922-a607-30963a9c4a60', name: 'Benton' },
    { id: '4c8cdb5e-1335-4a4a-89b0-523e02386af0', name: 'Washington' },
    { id: 'fa04f162-40ab-44cc-bbed-e8a40c613182', name: 'Louisiana' },
];

const ConversationDemo = () => {
    const [text, setText] = useState<string>('');
    const [county, setCounty] = useState<string>(counties[0].id);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { messages, status, error, sendMessage, regenerate } = useChat<ResearchAgentUIMessage>();
    
    const handleSubmit = (message: PromptInputMessage) => {
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files?.length);
      if (!(hasText || hasAttachments)) {
        return;
      }
      sendMessage(
        { 
          text: message.text || 'Sent with attachments',
          files: message.files 
        },
        {
          body: {
            county: county,
          },
        },
      );
      setText('');
    };

    const handleSuggestionClick = (suggestion: string) => {
      sendMessage({ text: suggestion });
    };

  return (
    <div className="relative w-full h-[700px] bg-background">
      <div className="flex flex-col h-full w-full">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
                description="Type a message below to begin chatting"
                className="mt-40"
              />
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text': // we don't use any reasoning or tool calls in this example
                          return (
                            <Response key={`${message.id}-${i}`}>
                              {part.text}
                            </Response>
                          );
                        case 'tool-search':
                          return (
                            <div  key={`${message.id}-${i}`} className="space-y-4 mb-2">
                                 {part.output?.status === "Search complete." ? (
                                    <span className="text-muted-foreground">{part.output.status}</span>
                                  ) : (
                                    <Shimmer>{part.output?.status ?? ''}</Shimmer>
                                  )}
                            </div>
                          )
                          case 'tool-readDocument':
                            return (
                              <div  key={`${message.id}-${i}`} className="space-y-4 mb-2">
                                {part.output?.status != "Read document." && (
                                     <Shimmer>{part.output?.status ?? ''}</Shimmer>
                                )}
                              </div>
                            )
                          case 'tool-answer':
                            return (
                              <div  key={`${message.id}-${i}`} className="space-y-4 mb-2">
                                {/* {part.output?.status != "Search complete." && (
                                     <Shimmer>{part.output?.status ?? ''}</Shimmer>
                                )} */}
                                <p className="mb-4"><TypewriterText text={part.output?.response ?? ''}/></p>
                                {part.output?.documents && (
  <div className="flex w-full max-w-lg flex-col gap-4">
    {part.output.documents.map((document:any, docIndex:number) => (
      <motion.div
        key={`${i}-${docIndex}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.3,
          delay: 0.1 + (docIndex * 0.05),
          ease: "easeOut"
        }}
      >      
      <Item variant="outline" size="sm" asChild>
      <a href={document.image} target="_blank" rel="noopener noreferrer">
        <ItemMedia>
          <FileTextIcon className="size-5" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle><span className="font-bold">{document.documentType} </span> <span className="font-light text-muted-foreground">| {document.documentNumber} | {document.filedDate} </span></ItemTitle>
        </ItemContent>
        <ItemActions>
          <ChevronRightIcon className="size-4" />
        </ItemActions>
      </a>
    </Item>
        {/* <Item variant="outline">
          <ItemContent>
            <ItemTitle>{document.documentType}</ItemTitle>
            <div className="flex h-5 items-center space-x-4 text-sm text-muted-foreground">
              <div>{document.documentNumber}</div>
              <Separator orientation="vertical" />
              <div>{document.filedDate}</div>
            </div>
          </ItemContent>
          {document.image && (
            <ItemActions>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => window.open(document.image, '_blank', 'noopener,noreferrer')}
              >
                <DownloadIcon className="size-4" />
              </Button>
            </ItemActions>
          )}
        </Item> */}
      </motion.div>
    ))}
  </div>
)}
                              </div>
                            )
                          case 'tool-askQuestion':
                              return (
                                <div  key={`${message.id}-${i}`} className="space-y-4 mb-2">
                                  <p className="mb-4"><TypewriterText text={part.output?.question ?? ''}/></p>
                                </div>
                              )
                        default:
                          if(isToolUIPart(part)){
                            return <div key={`${message.id}-${i}`}>Tool called: {getToolName(part)}</div>;
                          }
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              ))
              
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

{/* <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            <MessageResponse>
                              {JSON.stringify(part.text)}
                            </MessageResponse>
                          </MessageContent>
                          {message.role === 'assistant' && i === messages.length - 1 && (
                            <MessageActions>
                              <MessageAction
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </MessageAction>
                              <MessageAction
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Message>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
</Conversation> */}

        {/* <Suggestions>
            {suggestions.map((suggestion) => (
              <Suggestion
                key={suggestion}
                onClick={handleSuggestionClick}
                suggestion={suggestion}
                size={'sm'}
              />
            ))}
        </Suggestions> */}
        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
     
            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              ref={textareaRef}
              value={text}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputSelect
                onValueChange={(value) => {
                  setCounty(value);
                }}
                value={county}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {counties.map((county) => (
                    <PromptInputSelectItem key={county.id} value={county.id}>
                      {county.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export default ConversationDemo;