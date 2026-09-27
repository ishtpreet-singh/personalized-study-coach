export interface LearningProfileSummary {
  overallMastery: number;
  weakTopics: string[];
  strongTopics: string[];
  aiRecommendation: string;
}

export const profileApi = {
  getSummary: async (_subjectId: string): Promise<LearningProfileSummary> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      overallMastery: 72,
      weakTopics: ["Deadlocks"],
      strongTopics: ["Processes"],
      aiRecommendation: "Let's review Deadlock Avoidance next. I generated a quick practice scenario for you.",
    };
  }
};
