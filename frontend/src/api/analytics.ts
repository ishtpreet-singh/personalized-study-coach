export interface AnalyticsInsights {
  weakestSubject: string;
  weakestSubjectDrop: number;
  improvingTopic: string;
  improvingTopicIncrease: number;
  schedule: Array<{
    topic: string;
    dueInDays: number;
  }>;
}

export const analyticsApi = {
  getInsights: async (_subjectId?: string): Promise<AnalyticsInsights> => {
    // Simulate network delay for loading state
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      weakestSubject: "Deadlocks & Semaphores",
      weakestSubjectDrop: 12,
      improvingTopic: "Process Scheduling",
      improvingTopicIncrease: 17,
      schedule: [
        { topic: "Memory Management", dueInDays: 0 },
        { topic: "Process Scheduling", dueInDays: 2 },
      ]
    };
  }
};
