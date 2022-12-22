import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
import { OpenAIApi } from "openai";
import { CreateCompletionRequest, CreateImageRequest } from "openai/api";
import { v4 as uuidv4 } from "uuid";

interface PromptType {
  key: string;
  createPrompt: any;
  config: CreateCompletionRequest | CreateImageRequest;
  createComp: any;
}

export interface GenConfig {
  promptType: PromptType;
  maxHistoryLen?: number;
  prompt?: string;
  ignoreCache: boolean;
}

export interface MessageThread {
  messages: TextMessage[];
}

export interface TextMessage {
  id?: string | number;
  text: string[];
  images: string[];
  avatar: string;
  name: string;
  date: string | number | Date;
  objective?: string;
  dateCreated?: string | number;
  cached?: boolean;
  loading?: boolean;
}

const openAiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
};

const openai = new OpenAIApi(openAiConfig);
const options = {
  headers: {
    Authorization: `Bearer ${openAiConfig.apiKey}`,
  },
};

const createChatStartPrompt = (messages: TextMessage[]) => {
  let res = "### Chat-Bot\n";
  res += "The following is a conversation with an AI assistant.";
  res += "The assistant is helpful, creative, clever, and very friendly.\n\n";
  const maxLength = 10;

  let prompt = messages.map((message) => {
    const txts = message.text.map((txt) => txt.trim()).join("\n");
    let chunk = `### ${message.name.trim()}`;
    // const obj = message.objective?.trim()
    // if (obj) chunk += ` (${obj})`
    if (txts.trim().length === 0) return chunk;
    chunk += `\n${txts}`;
    return chunk;
  });
  prompt = prompt.filter((chunk) => chunk !== undefined);
  prompt = prompt.slice(-maxLength);
  res += prompt.join("\n\n");
  return res.trim();
};

const createClassificationPrompt = (message: TextMessage[]) => {
  // create some example prompts
  let res = "### Classification\n";
  res += "Categorize what to do next into one of the following categories: ";
  res += "generate_image, none\n";
  res += "If you are unsure, choose none.\n";

  const prompts = {
    generate_image: [
      "Could you create an image of a puppy?",
      "Create an image of a cat.",
      "Show me a picture depicting this.",
    ],
  };
  res += "\n### Examples\n";
  res += Object.keys(prompts)
    .map((type) => {
      const ex = prompts[type];
      return ex.map((p) => `Prompt: ${p}\nType: ${type}`).join("\n\n");
    })
    .join("\n");
  res += "\n";
  // grab the last 2 messages and join the texts
  const lastMessage = message.slice(-2, message.length - 1);
  const prompt = lastMessage.map((m) => m.text.join(". ")).join(". ");
  res += `\nPrompt: ${prompt}`;
  res += "\nType:";
  return res.trim();
};

const createImagePrompt = (message: TextMessage[]) => {
  const lastMessage = message.slice(-2, message.length - 1);
  return lastMessage.map((m) => m.text.join(". ")).join(". ");
};

export const promptTypes: Record<string, PromptType> = {
  chat: {
    key: "chat",
    createPrompt: createChatStartPrompt,
    config: {
      model: "text-davinci-002",
      max_tokens: 250,
      temperature: 0.75,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: ["###"],
    },
    createComp: openai.createCompletion,
  },
  classify_req: {
    key: "classify_req",
    createPrompt: createClassificationPrompt,
    config: {
      model: "text-babbage-001",
      temperature: 0.75,
      max_tokens: 10,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: ["\n", "Prompt:"],
    },
    createComp: openai.createCompletion,
  },
  generate_image: {
    key: "generate_image",
    createPrompt: createImagePrompt,
    config: {
      n: 1,
      size: "256x256",
      prompt: "A cute puppy",
    },
    createComp: openai.createImage,
  },
};

export const useCompStore = defineStore("counter", {
  state: () => ({
    completions: LocalStorage.getItem("completions") || {},
    threads: {
      main: {
        messages: [],
      },
      ...(LocalStorage.getItem("threads") || {}),
    } as Record<string, MessageThread>,
    currentThread: "main",
  }),
  getters: {
    getAllCompletions(state) {
      return state.completions;
    },
    getThread(state) {
      return state.threads[state.currentThread];
    },
  },
  actions: {
    getByHash(hash: string) {
      return this.completions[hash];
    },
    getByPrompt(prompt: string) {
      // first hash the prompt
      const hash = hashPrompt(prompt);
      // then return the completion
      return this.completions[hash];
    },
    updateCache() {
      LocalStorage.set("completions", this.completions);
      LocalStorage.set("threads", this.threads);
    },
    clearCache() {
      // clear whole local storage and reload
      LocalStorage.clear();
      location.reload();
    },
    clearThread() {
      this.threads[this.currentThread].messages = [];
      this.updateCache();
    },
    pushMessage(message: TextMessage) {
      if (message.id) {
        // look back through the messages to see if we already have this message
        // and update it if we do
        const existing = this.getThread.messages.find(
          (m) => m.id === message.id
        );
        if (existing !== undefined) {
          for (const key in message) {
            existing[key] = message[key];
          }
          existing.date = new Date();
          console.log("Updated message", { ...existing });
          this.updateCache();
          return existing;
        }
      }
      // otherwise, create uuid and push it
      message.id = uuidv4();
      this.getThread.messages.push(message);
      console.log("Pushed message", { ...message });
      this.updateCache();
      return message;
    },
    async genTextCompletion(config: GenConfig) {
      const prompt = config.promptType.createPrompt(this.getThread.messages);
      console.warn(prompt);
      const hash = hashPrompt(prompt);
      // if we already have a completion for this prompt, return it

      if (!config.ignoreCache && this.completions[hash]) {
        const choices = this.completions[hash].choices;
        const text = choices ? choices[0].text.trim().split("\n") : undefined;
        const images = this.completions[hash].data?.map((d: any) => d.url);
        return {
          result: this.completions[hash],
          text: text,
          images: images,
          cached: true,
          hash: hash,
        };
      }

      // otherwise, generate a new completion
      try {
        const completion = await config.promptType.createComp(
          {
            ...config.promptType.config,
            prompt: prompt,
          },
          options
        );

        if (!completion) throw new Error("No completion returned");
        // then add it to the cache
        this.completions[hash] = completion.data;
        this.updateCache();
        // and return it
        console.log(completion);
        const choices = completion.data.choices;
        const text = choices ? choices[0].text.trim().split("\n") : undefined;
        const images = this.completions[hash].data?.map((d: any) => d.url);
        return {
          result: completion.data,
          text: text,
          images: images,
          cached: false,
          hash: hash,
        };
      } catch (error: any) {
        if (error.response) {
          console.warn(error.response.status);
          console.warn(error.response.data);
          return {
            result: null,
            cached: false,
            hash: hash,
            errorMsg: `Error: ${error.response.status} ${error.response.data}`,
          };
        }

        return {
          result: null,
          cached: false,
          hash: hash,
          errorMsg: `Error: ${error}`,
        };
      }
    },
  },
});

export const hashPrompt = (prompt: string) => {
  let hash = 0;
  if (prompt.length === 0) return hash;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
};
