import { Notify } from "quasar";
import { AssistantConfigs } from "src/util/assistant/Assistants";
import { AssistantConfig } from "src/util/assistant/AssistantUtils";
import { ChatMessage, createMessageFromConfig } from "src/util/ChatUtils";

export const getRandomMinMax = (min: number, max: number) => Math.random() * (max - min) + min;

export const getRoboHashAvatarUrl = (seed: string) => {
	return `https://robohash.org/${seed}`;
};

interface ImageOptions {
	width?: number;
	height?: number;
}

export const getPicsumImgUrl = (seed: string, options?: ImageOptions) => {
	const w = options?.width || Math.round(getRandomMinMax(100, 800));
	const h = options?.height || Math.round(getRandomMinMax(100, 800));
	seed = seed.replace(/ /g, "_");
	return `https://picsum.photos/seed/${seed}/${w}/${h}`;
};

export const getTimeAgo = (date: string | number | Date) => {
	date = convertDate(date);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diff / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);
	const diffWeeks = Math.floor(diffDays / 7);
	const diffMonths = Math.floor(diffDays / 30);
	const diffYears = Math.floor(diffDays / 365);

	const timeAgo = {
		seconds: diffSeconds,
		minutes: diffMinutes,
		hours: diffHours,
		days: diffDays,
		weeks: diffWeeks,
		months: diffMonths,
		years: diffYears,
	};

	// should use plural?
	const shouldUsePlural = (value: number) => value > 1;

	// get time ago
	const getTimeAgo = (value: number, unit: string) => {
		return `${value} ${unit}${shouldUsePlural(value) ? "s" : ""} ago`;
	};

	// get time ago
	if (timeAgo.years > 0) {
		return getTimeAgo(timeAgo.years, "year");
	} else if (timeAgo.months > 0) {
		return getTimeAgo(timeAgo.months, "month");
	} else if (timeAgo.weeks > 0) {
		return getTimeAgo(timeAgo.weeks, "week");
	} else if (timeAgo.days > 0) {
		return getTimeAgo(timeAgo.days, "day");
	} else if (timeAgo.hours > 0) {
		return getTimeAgo(timeAgo.hours, "hour");
	} else if (timeAgo.minutes > 0) {
		return getTimeAgo(timeAgo.minutes, "minute");
	} else if (timeAgo.seconds > 0) {
		return getTimeAgo(timeAgo.seconds, "second");
	} else {
		return "just now";
	}
};

export const dateToStr = (date: string | number | Date) => {
	date = convertDate(date);
	const options = {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
	};
	return date.toLocaleDateString("en-US", options);
};

export const convertDate = (date: string | number | Date): Date => {
	if (typeof date === "string" || typeof date === "number") {
		date = new Date(date);
	}
	return date;
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const smartNotify = (message: string) => {
	Notify.create({
		message: message,
		timeout: 500,
	});
};

export const handleAssistant = async (msg: ChatMessage, comp: any) => {
	const cfg = AssistantConfigs[msg.assistantKey];
	const res = await comp.generate(cfg, msg.result?.messageIds);
	console.log(res);
	msg.text = [];
	msg.images = [];
	msg.cached = res.cached;
	msg.result = res.result;
	msg.loading = false;
	msg.isRegen = msg.result?.messageIds ? msg.result.messageIds.length > 0 : false;
	if (res.errorMsg) {
		msg.text.push("[ERROR]\n" + res.errorMsg);
		comp.pushMessage(msg);
		return;
	}

	if (res?.images) msg.images.push(...res.images);
	if (res?.text) msg.text.push(...res.text);

	// const totalLength = msg.text.reduce((a, b) => a + b.length, 0) + msg.images.reduce((a, b) => a + b.length, 0)
	// const sleepTime = totalLength * 25
	// console.log(`sleepTime: ${sleepTime}`)
	// await sleep(sleepTime)

	comp.pushMessage(msg);

	const requiredFollowUps = cfg?.followUps;
	// if null or undefined, exit
	if (!requiredFollowUps) return;
	// if string, make it an array
	// for each
	// filter out texts that contain <prompt> tags
	let prompts = msg.text
		.filter((t: string) => t.includes("<prompt>"))
		.map((t: string) => t.split("<prompt>")[1].trim().split("</prompt>")[0].trim());

	msg.text = msg.text.map((t: string) => {
		if (t.includes("<prompt>")) {
			const parts = t.split("<prompt>");
			const end = parts[1].split("</prompt>");
			return parts[0] + end[1];
		}
		return t.trim();
	});
	msg.text = msg.text.filter((t: string) => t.length > 0);
	// msg.text = msg.text.map((t: string) => t.replace("<prompt>", "").replace("</prompt>", ""))
	comp.pushMessage(msg);

	prompts = prompts.filter((t: string) => t.split(" ").length > 3);
	if (prompts.length > 0) {
		console.log("promptText", prompts);

		// return true;
		// const nextActor = `${comp.assistantKey}_gen`;
		for (let i = 0; i < prompts.length; i++) {
			const prompt = prompts[i];
			// const nextMsg = createMessageFromAiKey(nextActor, comp);
			// if (!prompt) {
			// 	nextMsg.text.push(`[Error: Prompt text is empty]`);
			// 	nextMsg.loading = false;
			// 	comp.pushMessage(nextMsg);
			// 	continue;
			// }
			msg.text.push(`<prompt>${prompt}</prompt>`);
			// await handleAssistant(nextMsg, comp);
		}
	}
};
export const handleCoordinator = async (comp: any, orderedResponses?: boolean) => {
	orderedResponses = orderedResponses === undefined ? true : orderedResponses;
	const coordConf: AssistantConfig = AssistantConfigs.coordinator;
	const coordMsg: ChatMessage = createMessageFromConfig(coordConf, comp);

	const res = await comp.generate(coordConf);

	console.log(res);
	coordMsg.cached = res.cached;
	coordMsg.result = res.result;
	coordMsg.loading = false;

	if (res.errorMsg) {
		coordMsg.text.push("[ERROR]\n" + res.errorMsg);
		comp.pushMessage(coordMsg);
		return;
	}
	if (!res.text) {
		coordMsg.text.push("Error: No text in result]");
		comp.pushMessage(coordMsg);
		return;
	}
	coordMsg.text = res.text ? [...res.text] : ["An error occurred"];
	comp.pushMessage(coordMsg);
	const nextActors = res.text
		.flatMap((t: string) => t.toLowerCase().split("\n"))
		.filter((t: string) => t.includes("respond"))
		.flatMap((t: string) => t.split(":")[1].split(","))
		.map((a: string) => a.trim().toLowerCase());

	// for each actor, call the appropriate handler
	console.log("Next Actors: ", nextActors);
	for (let nextKey of nextActors) {
		nextKey = nextKey.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
		const nextCfg: AssistantConfig = AssistantConfigs[nextKey];
		const nextMsg = createMessageFromConfig(nextCfg, comp);
		if (!nextCfg) {
			nextMsg.text.push(`[Error: Unknown assistant key: ${nextKey}]`);
			nextMsg.loading = false;
			comp.pushMessage(nextMsg);
			return;
		}
		if (orderedResponses) {
			await handleAssistant(nextMsg, comp);
		} else {
			handleAssistant(nextMsg, comp);
		}
	}
};
