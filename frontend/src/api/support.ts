import apiClient from './client';

export interface SupportTicketCreate {
  name: string;
  email: string;
  subject: string;
  description: string;
  screenshot?: File;
}

export interface BugReportCreate {
  browser?: string;
  operating_system?: string;
  current_url?: string;
  timestamp?: string;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  screenshot?: File;
}

export const supportApi = {
  createSupportTicket: async (data: SupportTicketCreate) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    if (data.screenshot) {
      formData.append('screenshot', data.screenshot);
    }
    const response = await apiClient.post('/api/v1/support/contact', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createBugReport: async (data: BugReportCreate) => {
    const formData = new FormData();
    if (data.browser) formData.append('browser', data.browser);
    if (data.operating_system) formData.append('operating_system', data.operating_system);
    if (data.current_url) formData.append('current_url', data.current_url);
    if (data.timestamp) formData.append('timestamp', data.timestamp);
    if (data.steps_to_reproduce) formData.append('steps_to_reproduce', data.steps_to_reproduce);
    if (data.expected_behavior) formData.append('expected_behavior', data.expected_behavior);
    if (data.actual_behavior) formData.append('actual_behavior', data.actual_behavior);
    if (data.screenshot) {
      formData.append('screenshot', data.screenshot);
    }
    const response = await apiClient.post('/api/v1/support/bug-report', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
