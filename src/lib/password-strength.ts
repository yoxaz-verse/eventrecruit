import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as english from "@zxcvbn-ts/language-en";

export const MIN_NEW_PASSWORD_LENGTH = 15;
export const MIN_NEW_PASSWORD_SCORE = 3;

const estimator = new ZxcvbnFactory({
  dictionary: { ...common.dictionary, ...english.dictionary },
  graphs: common.adjacencyGraphs,
  translations: english.translations,
});

export function checkNewPassword(password: string) {
  const length = Array.from(password).length;
  if (length < MIN_NEW_PASSWORD_LENGTH) {
    return {
      score: 0,
      strong: false,
      reason: `Use at least ${MIN_NEW_PASSWORD_LENGTH} characters (${length}/${MIN_NEW_PASSWORD_LENGTH}).`,
    };
  }

  // Return only safe feedback. The estimator's result also contains the password itself.
  const result = estimator.check(password);
  if (result.score < MIN_NEW_PASSWORD_SCORE) {
    return {
      score: result.score,
      strong: false,
      reason: result.feedback.suggestions[0] || result.feedback.warning || "Use a longer, less predictable password or passphrase.",
    };
  }

  return { score: result.score, strong: true, reason: "Strong password." };
}
