import {ChatMessage} from "src/util/ChatUtils";
import {promptConversation, promptExamples, promptMembers, promptRules,} from "src/util/prompt/PromptUtils";
import {Assistant} from "src/util/assistant/AssistantModels";

export const createAssistantPrompt = (
	ai: Assistant,
	messages: ChatMessage[]
): any => {
	let start = "### AI GROUP CHAT ###\n";
	start +=
		"The following is a group-chat conversation between a human and several AI assistants.\n";

	const members = promptMembers(false, ai);
	const rules = promptRules(ai);
	const examples = promptExamples(ai);
	const conv = promptConversation(messages);
	const end = `### ${ai.name}:\n`;

	return {
		prompt: finalizePrompt([start, members, rules, examples, conv, end]),
		relevantMsgIds: messages.map((m) => m.id),
	};
};

export const createPromptDalleGen = (
	ai: Assistant,
	messages: ChatMessage[]
) => {
	const usedMessage: ChatMessage = messages[messages.length - 1];
	// last text
	let prompt: string = usedMessage.textSnippets[usedMessage.textSnippets.length - 1];
	prompt = prompt.replace(/(<([^>]+)>)/gi, "");
	return {
		prompt: prompt,
		relevantMsgIds: [usedMessage.id],
	};
};

export const createPromptCodexGen = (
	ai: Assistant,
	messages: ChatMessage[]
) => {
	const start = "### CODE GENERATION ###\n";

	const rules = promptRules(ai);
	const examples = promptExamples(ai);

	const usedMessage: ChatMessage = messages[messages.length - 1];
	// last text
	let prompt = "### PROMPT:\n";
	prompt += usedMessage.textSnippets[usedMessage.textSnippets.length - 1].replace(
		/(<([^>]+)>)/gi,
		""
	);

	const end = `### CODE:\n`;

	return {
		prompt: finalizePrompt([start, rules, examples, prompt, end]),
		relevantMsgIds: [usedMessage.id],
	};
};

const finalizePrompt = (all: string[]): string => {
	all = all.filter((s) => s.length > 0);
	all = all.map((s) => s.trim());
	return all.join("\n\n");
};
