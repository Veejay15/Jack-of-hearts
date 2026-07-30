// Question bank for the post-game forfeit. The winner(s) pick a question
// from here for the loser(s) to answer out loud on the call. Shared by the
// client (to render the picker) and the server (to validate submissions).

export type RewardCategory = {
  id: string;
  label: string;
  blurb: string;
  questions: readonly string[];
};

export const REWARD_CATEGORIES: readonly RewardCategory[] = [
  {
    id: "seo",
    label: "SEO",
    blurb: "Prove you still know your craft.",
    questions: [
      "What does E-E-A-T stand for, and why does Google care?",
      "Explain the difference between a 301 and a 302 redirect — and when a 302 quietly ruins your day.",
      "What is a canonical tag for, and what happens when two pages point canonicals at each other?",
      "Pitch us one white-hat link-building tactic you would actually use this quarter.",
      "Explain the difference between crawling, indexing, and ranking in under a minute.",
      "Name the three Core Web Vitals and what each one measures.",
      "“Keyword stuffing still works.” Defend or destroy in 30 seconds.",
      "What is your favorite SEO tool, and what would make you abandon it?",
      "Explain search intent to an imaginary client who only cares about ranking #1.",
      "What is hreflang for, and when does a site actually need it?",
    ],
  },
  {
    id: "funny",
    label: "Funny",
    blurb: "Embarrassing stories welcome here.",
    questions: [
      "What is the most embarrassing thing you have done on a video call?",
      "Tell us about a time you sent a message to the very wrong person.",
      "What is your most embarrassing work-from-home moment?",
      "What is the weirdest thing you have googled this week? Be honest.",
      "Reenact your reaction the last time your internet died mid-meeting.",
      "What food combination do you love that everyone else finds disgusting?",
      "Describe your worst haircut era. Details required.",
      "What is the silliest reason you have ever been late to a meeting?",
      "You have 60 seconds to find and show the oldest photo of yourself you can.",
      "What did you want to be when you grew up, and what went wrong?",
    ],
  },
  {
    id: "would-you-rather",
    label: "Would you rather",
    blurb: "Pick a side and defend it.",
    questions: [
      "Would you rather always be 10 minutes late or always 20 minutes early? Defend it.",
      "Would you rather lose all your bookmarks or your entire browser history?",
      "Would you rather work from a beach with terrible Wi-Fi or an office with fiber?",
      "Would you rather never use a mouse again or never use keyboard shortcuts again?",
      "Would you rather have unlimited free coffee or unlimited free food delivery?",
      "Would you rather rank #1 for one huge keyword for a year, or #5 for a hundred keywords forever?",
      "Would you rather give up music or movies for a whole year?",
      "Would you rather time-travel 10 years back or 10 years forward?",
    ],
  },
  {
    id: "get-to-know",
    label: "Get to know",
    blurb: "Wholesome only. No traps.",
    questions: [
      "What is a skill you would learn instantly if you could?",
      "What is the best purchase you have made under $50?",
      "What is your comfort food after a rough week?",
      "If you could live in any city for a year, all expenses paid, where and why?",
      "What movie or show can you rewatch forever?",
      "What is one bucket-list item you will actually do in the next five years?",
      "What hobby would you pick up if time and money did not matter?",
      "What is the best advice anyone has ever given you?",
    ],
  },
];

export function findRewardQuestion(
  categoryId: string,
  question: string,
): boolean {
  const cat = REWARD_CATEGORIES.find((c) => c.id === categoryId);
  return !!cat && cat.questions.includes(question);
}
