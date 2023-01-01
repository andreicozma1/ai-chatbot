import { basePersonalityTraits, baseStrengths, createPromptDalleGen, generationInstructions } from "src/util/AiPrompts"
import { createAssistantPrompt } from "src/util/assistants/BaseAssistant"
import { createPromptCoordinator } from "src/util/assistants/BaseCoordinator"
import { ActorConfig } from "src/util/Models"
import { openai } from "src/util/OpenAIUtil"

const BaseAssistantApiConfig = {
	model: "text-davinci-003",
	max_tokens: 200,
	temperature: 0.9,
	top_p: 1,
	frequency_penalty: 0.0,
	presence_penalty: 0.6,
	stop: ["###"],
};
export const actors: Record<string, ActorConfig> = {
	davinci: {
		key: "davinci",
		name: "Davinci",
		icon: "chat",
		createPrompt: createAssistantPrompt,
		config: {
			...BaseAssistantApiConfig,
		},
		personality: ["helpful", ...basePersonalityTraits],
		strengths: ["providing general information", ...baseStrengths],
	},
	dalle: {
		key: "dalle",
		name: "DALL-E",
		icon: "image",
		createPrompt: createAssistantPrompt,
		createGen: "dalle_gen",
		config: {
			...BaseAssistantApiConfig,
		},
		personality: ["artistic", "creative", "visionary", ...basePersonalityTraits],
		strengths: ["making art", "coming up with creative ideas", ...baseStrengths],
		abilities: ["Generating images from text descriptions"],
		instructions: [...generationInstructions],
	},
	codex: {
		key: "codex",
		name: "Codex",
		icon: "code",
		createPrompt: createAssistantPrompt,
		createGen: "codex_gen",
		config: {
			...BaseAssistantApiConfig,
		},
		personality: ["analytical", "logical", "rational", ...basePersonalityTraits],
		strengths: ["programming", "math", "science", "logic", ...baseStrengths],
		abilities: ["Generating code from text descriptions"],
		instructions: [...generationInstructions],
	},
	coordinator: {
		key: "coordinator",
		name: "Coordinator",
		icon: "question_answer",
		createPrompt: createPromptCoordinator,
		config: {
			model: "text-davinci-003",
			temperature: 0.5,
			max_tokens: 25,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: ["###"],
		},
		vals: {
			willRespond: "Will Respond",
			willIgnore: "Will Ignore",
		},
		available: false,
	},
	dalle_gen: {
		key: "dalle_gen",
		name: "DALL-E",
		icon: "image",
		createPrompt: createPromptDalleGen,
		createComp: openai.createImage,
		config: {
			n: 1,
			size: "256x256",
			prompt: "A cute puppy",
		},
		available: false,
	},
};