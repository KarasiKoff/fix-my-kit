export type RepairRequest = {
    id: string;
    deviceId: string;
    requesterName: string;
    description: string;
    status: 'new' | 'in_progress' | 'closed';
    takenBySysadmin: boolean;
    createdAt: string;
    ticketId?: string;
    ticketKey?: string;
    ticketUrl?: string;
    lastSyncedAt?: string;
};

export type RepairRequestDetail = RepairRequest & {
    resolutionNote?: string | null;
    closedAt?: string | null;
    closedByTrackerDisplay?: string | null;
};
