import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {User, UserTypes} from "src/util/chat/User";

export const assistantFilter = (user?: User) =>
	!user || user.type === UserTypes.ASSISTANT || user.type === UserTypes.HELPER;

export class UserAssistant extends User {
	constructor(id: string, name: string) {
		super(id, name, UserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.CONVERSATION;
		this.addTraits({
						   personality: ["friendly", "polite", "helpful"],
						   strengths: ["making conversation", "answering questions"],
						   weaknesses: [],
						   abilities: []
					   })
		this.addRules({
						  always: [
							  "Respond in a way that follows the logical flow and consistency of the conversation.",
							  "Strictly follow rules, examples, and guidelines.",
							  "Ask for clarification or additional information if needed to respond appropriately.",
						  ],
						  never: [
							  "Repeat what other assistants have recently said or asked the user.",
							  "Make assumptions about the user's intentions.",
						  ],
						  sometimes: [
							  "May tag other assistants with their ID (not their name) if their area of expertise is needed.",
						  ]
					  })
	}
}
