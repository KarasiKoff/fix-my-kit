export type RepairRequest = {
    id: string;
    deviceId: string;
    requesterName: string;
    description: string;
    status: 'new' | 'in_progress' | 'closed';
    applicantType: 'public' | 'internal';
    takenBySysadmin: boolean;
    createdAt: string;
    ticketId?: string;
    ticketKey?: string;
    ticketUrl?: string;
};
