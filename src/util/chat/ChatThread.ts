import {ChatMessage} from "src/util/chat/ChatMessage";
import {getAppVersion} from "src/util/Utils";
import {v4 as uuidv4} from "uuid";
import {User} from "src/util/users/User";
import {smartNotify} from "src/util/SmartNotify";
import {parseDate} from "src/util/DateUtils";

export interface ChatThreadPrefs {
	hiddenUserIds: string[];
	hideIgnoredMessages: boolean;
	orderedResponses: boolean;
}

export class ChatThread {
	private static readonly defaultThreadName = "New Thread";
	private static readonly defaultPrefs: ChatThreadPrefs = {
		hiddenUserIds: [],
		hideIgnoredMessages: false,
		orderedResponses: true,
	};

	public id: string;
	public name: string = ChatThread.defaultThreadName;
	public prefs: ChatThreadPrefs = ChatThread.defaultPrefs;
	public appVersion: string = getAppVersion();
	private joinedUserIds: string[] = [];
	private messageIdMap: { [key: string]: ChatMessage } = {};

	constructor(
		name?: string,
		joinedUserIds?: string[],
		prefs?: ChatThreadPrefs
	) {
		this.id = uuidv4();
		if (name) this.name = name;
		if (joinedUserIds) this.joinedUserIds.push(...joinedUserIds);
		if (prefs) {
			this.prefs = {
				...this.prefs,
				...prefs,
			};
		}
	}

	addUser(user: User): void {
		this.joinedUserIds.push(user.id);
		if (user.requiresUserIds) this.joinedUserIds.push(...user.requiresUserIds);
		// de-duplicate
		this.joinedUserIds = Array.from(new Set(this.joinedUserIds));
	}

	getJoinedUsers(getUserCallback: (id: string) => User | undefined): User[] {
		return this.joinedUserIds.map(getUserCallback).filter((u: User | undefined) => u !== undefined) as User[]
	}

	getMessageIdMap(): { [key: string]: ChatMessage } {
		for (const messageId in this.messageIdMap) {
			if (!(this.messageIdMap[messageId] instanceof ChatMessage)) {
				console.warn("Prototype does not match ChatMessage");
				console.log("getMessagesIdsMap->before:", this.messageIdMap[messageId]);
				this.messageIdMap[messageId] = Object.assign(new ChatMessage(), this.messageIdMap[messageId]);
				console.log("getMessagesIdsMap->after:", this.messageIdMap[messageId]);
			}
		}
		return this.messageIdMap;
	}

	getMessagesArray(): ChatMessage[] {
		const messages: ChatMessage[] = Object.values(this.getMessageIdMap());
		messages.sort((a: ChatMessage, b: ChatMessage) => {
			const ad = parseDate(a.dateCreated).getTime();
			const bd = parseDate(b.dateCreated).getTime();
			return ad - bd;
		});
		return messages;
	}

	getMessagesArrayFromIds(messageIds: string[]): ChatMessage[] {
		const messages: ChatMessage[] = messageIds.map((messageId: string) => this.getMessageIdMap()[messageId])
			.filter((message: ChatMessage | undefined) => message !== undefined)
		messages.sort((a: ChatMessage, b: ChatMessage) => {
			const ad = parseDate(a.dateCreated).getTime();
			const bd = parseDate(b.dateCreated).getTime();
			return ad - bd;
		});
		return messages;
	}

	addMessage(message: ChatMessage): void {
		if (this.getMessageIdMap()[message.id]) {
			delete this.messageIdMap[message.id];
		}
		this.messageIdMap[message.id] = message;
	}

	deleteMessage(messageId: string): void {
		if (!this.getMessageIdMap()[messageId]) {
			smartNotify("An error occurred while deleting the message.");
			console.error(
				`An error occurred while deleting the message: ${messageId}`
			);
			return;
		}
		const followUpIds = this.messageIdMap[messageId].followupMsgIds;
		followUpIds?.forEach((followUpId: string) => {
			this.deleteMessage(followUpId);
		});
		delete this.messageIdMap[messageId];
		this.notify(`Deleted message: ${messageId}`);
	}


	clearMessages(): void {
		this.notify('Clearing messages');
		this.messageIdMap = {};
	}

	clearJoinedUsers(): void {
		this.notify('Clearing joined users');
		this.joinedUserIds = [];
	}

	resetPrefs(): void {
		this.notify('Resetting thread preferences');
		this.prefs = ChatThread.defaultPrefs;
	}

	resetAll(): void {
		this.notify('Resetting thread');
		this.clearMessages();
		this.clearJoinedUsers();
		this.resetPrefs();
		this.name = ChatThread.defaultThreadName;
		this.appVersion = getAppVersion();
	}

	notify(message: string): void {
		smartNotify(message, `Thread: "${this.name}" (${this.id})`);
	}
}