export interface StudyPlanItem {
  id: string;
  topic: string;
  type: 'review' | 'practice' | 'read';
  durationMins: number;
}

export interface StudyPlan {
  id: string;
  items: StudyPlanItem[];
  totalDurationMins: number;
  generatedAt: Date;
}

export const plannerApi = {
  generatePlan: async (_subjectId?: string): Promise<StudyPlan> => {
    // Simulate network delay for loading state
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      id: 'p1',
      totalDurationMins: 90,
      generatedAt: new Date(),
      items: [
        { id: 'i1', topic: 'Review Deadlocks', type: 'review', durationMins: 30 },
        { id: 'i2', topic: 'Practice Memory Layout', type: 'practice', durationMins: 45 },
        { id: 'i3', topic: 'Read Chapter 4', type: 'read', durationMins: 15 }
      ]
    };
  }
};
