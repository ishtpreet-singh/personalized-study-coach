export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'quiz' | 'revision' | 'study' | 'exam';
  subject?: string;
}

export const calendarApi = {
  getEvents: async (month: number, year: number): Promise<CalendarEvent[]> => {
    // Simulate network delay for loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 'c1',
        title: "DBMS Midterm",
        date: new Date(year, month, 18),
        type: 'exam',
        subject: "DBMS"
      },
      {
        id: 'c2',
        title: "OS Revision",
        date: new Date(year, month, 14),
        type: 'revision',
        subject: "Operating Systems"
      },
      {
        id: 'c3',
        title: "Weekly Practice",
        date: new Date(year, month, 20),
        type: 'quiz',
        subject: "Data Structures"
      }
    ];
  }
};
