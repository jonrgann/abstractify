import { convertToModelMessages, UIMessageChunk, type UIMessage } from "ai";
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import { researchAgentTools } from "./steps/tools";

/**
 * The main chat workflow
 */
export async function chat(messages: UIMessage[]) {
	"use workflow";

	console.log("Starting workflow");

	const writable = getWritable<UIMessageChunk>();

	const agent = new DurableAgent({
		model: "google/gemini-2.5-flash",
		system: `You are a helpful title research assistant for a Real Estate Title Company.  
    You answer questions about county records by searching the title plant system.
    - You must use the search tool to gather information about the documents requested.
    - Then use the answer tool to provide the response and documents to the user.
    - If the user asks about a specific document, read the document first before answering.
    - If the user does not provide a start or end date use null.
    - Format dats as YYYY-MM-DD`,
	
	   tools: researchAgentTools,

	});

	await agent.stream({
		messages: convertToModelMessages(messages),
		writable,
	});

	console.log("Finished workflow");
}
