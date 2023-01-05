import {PromptRules, PromptTraits} from "src/util/prompt/PromptModels";

export interface Assistant {
	key: string;
	name: string;
	icon: string;
	apiConfig: {
		apiReqType: string;
		apiReqOpts?: string;
	};
	/*******************************************************************************************************************
	 ### Prompt Configuration
	 - TODO: Move these into a separate interface (promptConfig)
	 ******************************************************************************************************************/
	promptStyle: any;
	traits?: PromptTraits;
	rules?: PromptRules;
	examples?: string[]; 			// Order: Human, AI, Human, AI, etc.
	/*******************************************************************************************************************
	 ### Flags
	 - TODO: Move these into a separate interface (flags)
	 ******************************************************************************************************************/
	allowPromptFollowUps?: boolean;
	isAvailable?: boolean; 			// Whether to show this AI in the list of available AIs
	isHelper?: boolean;
	shouldIgnoreCache?: boolean;
	/*******************************************************************************************************************
	 ### Other Props
	 ******************************************************************************************************************/
	extras?: {
		[key: string]: any;
	};
}

// TODO: Find better name for these and move them to a separate file
export interface ProcessKVConfig {
	keyStartChar?: string;
	valJoinStr?: string;
	inline?: boolean;
}