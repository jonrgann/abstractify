'use client';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
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
import { useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { getToolName, isToolUIPart } from 'ai';
import { ResearchAgentUIMessage } from '@/lib/agents/researchAgent';
import { GlobeIcon, FileText, ChevronRightIcon } from 'lucide-react';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { TypewriterText } from '@/components/typewrter';
import { motion, AnimatePresence } from 'motion/react'
import { Separator } from '@/components/ui/separator';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

import { MessageSquare, ShieldAlertIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const suggestions = [
  'Can I get the plat for Huntington Hills Lot 19 Block 2',
];

const models = [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus' },
  ];

  const counties = [
    { id: '54766f37-bfad-4922-a607-30963a9c4a60', name: 'Benton' },
  ];

const ConversationDemo = () => {
    const [text, setText] = useState<string>('');
    const [model, setModel] = useState<string>(models[0].id);
    const [county, setCounty] = useState<string>(counties[0].id);
    const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { messages, status, error, sendMessage } = useChat<ResearchAgentUIMessage>();
    
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
            model: model,
            webSearch: useWebSearch,
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
                                 {part.output?.status === "Read document." ? (
                                    <span className="text-muted-foreground">{part.output.status}</span>
                                  ) : (
                                    <Shimmer>{part.output?.status ?? ''}</Shimmer>
                                  )}
                              </div>
                            )
                          case 'tool-answer':
                            return (
                              <div  key={`${message.id}-${i}`} className="space-y-4 mb-2">
                                <p className="mb-4"><TypewriterText text={part.output?.response ?? ''}/></p>
                                { part.output?.documents && (
                                    part.output?.documents.map((doc: any, rowIndex: number) => {
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
                                      <div className="flex w-full max-w-lg flex-col gap-6">
                                            <Item variant="outline">
                                              <ItemContent>
                                                <ItemTitle>{doc.documentType}</ItemTitle>
                                                <div className="flex h-5 items-center space-x-4 text-sm text-muted-foreground">
                                                  <div>{doc.documentNumber}</div>
                                                  <Separator orientation="vertical" />
                                                  <div>{doc.filedDate}</div>
                                              </div>
                                              </ItemContent>
                                              { doc.image && (
                                                <ItemActions>
                                                  <Button 
                                                    variant="outline" 
                                                    size="icon"
                                                    onClick={() => window.open(doc.image, '_blank', 'noopener,noreferrer')}
                                                  >
                                                    <DownloadIcon className="size-4" />
                                                  </Button>
                                                </ItemActions>
                                              )}
                                            </Item>
                                          </div>
                                        </motion.div>
                                      );
                                    })
                                )}
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