import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {newlineSeparated, wrapInCodeBlock} from "src/util/TextUtils";
import {User, UserTypes} from "src/util/chat/users/User";

export class UserDalleGen extends User {
	constructor() {
		super("dalle_gen", "DALL-E Generator", UserTypes.HELPER);
		this.icon = "image"
		this.apiReqConfig = ApiRequestConfigTypes.DALLE_GEN;
		this.showInMembersInfo = false;
	}
}

export class UserCodexGen extends User {
	constructor() {
		super("codex_gen", "Codex Generator", UserTypes.HELPER);
		this.icon = "code"
		this.apiReqConfig = ApiRequestConfigTypes.CODEX_GEN;
		this.showInMembersInfo = false;
		this.promptConfig.promptHeader = "Instructions"
		this.promptConfig.responseHeader = "Response"

		this.addRules({
						  always: [
							  "Use Markdown and wrap any code in a code block.",
							  "Use a language identifier for the code block if possible.",
							  "Before each code block, write a description or explanation of what the following code will do."
						  ],
					  })

		this.addExamples([
							 // TODO: Use LeetCode Examples
							 // ------------------------------------------------------------
							 newlineSeparated(
								 "Language: Python",
								 "1. Write a function that multiplies two numbers together.",
								 "2. Run the an example with the numbers 5 and 6.",
								 "3. Print the result."
							 ),
							 // ------------------------------------------------------------
							 newlineSeparated(
								 "# Multiplying Numbers",
								 "Language: Python",
								 "## Function Definition",
								 "First, we define a function called `multiply`, which takes two parameters, `a` and `b`."
							 ) + "\n" +
							 wrapInCodeBlock("python", "def multiply(a, b):", "\treturn a * b") +
							 newlineSeparated(
								 "## Example",
								 "Next, run the function with the numbers 5 and 6, and print the result."
							 ) + "\n" +
							 wrapInCodeBlock("python", "result = multiply(5, 6)", "print(result)"),
							 // ------------------------------------------------------------
						 ]
		)
	}
}
