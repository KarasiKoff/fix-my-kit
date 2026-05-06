export type RepairRequest = {
    id: string;
    deviceId: string;
    requesterName: string;
    description: string;
    status: 'new' | 'in_progress' | 'closed';
    ticketId?: string;
    ticketUrl?: string;
};
