"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadWebSocket = void 0;
const ws_1 = require("ws");
const Contractor_1 = require("../models/Contractor");
class LeadWebSocket {
    constructor() {
        this.wss = null;
        this.connections = new Map();
        this.contractorConnections = new Map();
        this.heartbeatInterval = null;
        this.HEARTBEAT_INTERVAL = 30000;
        this.HEARTBEAT_TIMEOUT = 60000;
    }
    start(server) {
        this.wss = new ws_1.Server({
            server,
            path: '/ws/leads',
            perMessageDeflate: false,
        });
        this.wss.on('connection', (ws) => {
            console.log('[WebSocket] New connection established');
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleMessage(ws, message);
                }
                catch (error) {
                    console.error('[WebSocket] Failed to parse message:', error);
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
                }
            });
            ws.on('pong', () => {
                const conn = this.connections.get(ws);
                if (conn) {
                    conn.isAlive = true;
                }
            });
            ws.on('close', (code, reason) => {
                console.log(`[WebSocket] Connection closed: ${code} - ${reason.toString()}`);
                this.removeConnection(ws);
            });
            ws.on('error', (error) => {
                console.error('[WebSocket] Connection error:', error);
                this.removeConnection(ws);
            });
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Connected to GetOnlyPros lead stream',
                timestamp: new Date().toISOString(),
            }));
        });
        this.wss.on('error', (error) => {
            console.error('[WebSocket] Server error:', error);
        });
        this.startHeartbeat();
        console.log('[WebSocket] Lead WebSocket server started on /ws/leads');
    }
    async handleMessage(ws, message) {
        switch (message.type) {
            case 'auth': {
                if (message.contractorId) {
                    await this.authenticateConnection(ws, message.contractorId, message.zipCodes || [], message.serviceTypes || []);
                }
                break;
            }
            case 'ping': {
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            }
            case 'subscribe': {
                const conn = this.connections.get(ws);
                if (conn) {
                    if (message.zipCodes)
                        conn.zipCodes = message.zipCodes;
                    if (message.serviceTypes)
                        conn.serviceTypes = message.serviceTypes || [];
                    ws.send(JSON.stringify({
                        type: 'subscribed',
                        zipCodes: conn.zipCodes,
                        serviceTypes: conn.serviceTypes,
                    }));
                }
                break;
            }
            default: {
                ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
            }
        }
    }
    async authenticateConnection(ws, contractorId, zipCodes, serviceTypes) {
        try {
            if (zipCodes.length === 0 || serviceTypes.length === 0) {
                const contractor = await Contractor_1.Contractor.findById(contractorId);
                if (contractor) {
                    zipCodes = contractor.serviceZipCodes?.map(String) || [];
                    serviceTypes = contractor.serviceTypes?.map(String) || [];
                }
            }
            const connection = {
                ws,
                contractorId,
                zipCodes,
                serviceTypes,
                isAlive: true,
                connectedAt: new Date(),
            };
            this.connections.set(ws, connection);
            if (!this.contractorConnections.has(contractorId)) {
                this.contractorConnections.set(contractorId, new Set());
            }
            this.contractorConnections.get(contractorId).add(ws);
            ws.send(JSON.stringify({
                type: 'authenticated',
                contractorId,
                zipCodes,
                serviceTypes,
                message: 'Successfully authenticated',
            }));
            console.log(`[WebSocket] Contractor ${contractorId} authenticated with ${zipCodes.length} zip codes`);
        }
        catch (error) {
            console.error(`[WebSocket] Authentication failed for ${contractorId}:`, error);
            ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
        }
    }
    removeConnection(ws) {
        const conn = this.connections.get(ws);
        if (conn) {
            const { contractorId } = conn;
            const contractorWsSet = this.contractorConnections.get(contractorId);
            if (contractorWsSet) {
                contractorWsSet.delete(ws);
                if (contractorWsSet.size === 0) {
                    this.contractorConnections.delete(contractorId);
                }
            }
            this.connections.delete(ws);
            console.log(`[WebSocket] Removed connection for contractor ${contractorId}`);
        }
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            for (const [ws, conn] of this.connections) {
                if (!conn.isAlive) {
                    console.log(`[WebSocket] Terminating inactive connection for contractor ${conn.contractorId}`);
                    ws.terminate();
                    continue;
                }
                conn.isAlive = false;
                ws.ping();
            }
        }, this.HEARTBEAT_INTERVAL);
    }
    stop() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.wss) {
            for (const [ws] of this.connections) {
                ws.close(1000, 'Server shutting down');
            }
            this.wss.close();
            this.wss = null;
        }
        this.connections.clear();
        this.contractorConnections.clear();
        console.log('[WebSocket] Lead WebSocket server stopped');
    }
    broadcastNewLead(lead) {
        if (!this.wss || this.connections.size === 0)
            return;
        const leadZipCode = lead.zipCode?.toString() || '';
        const leadServiceType = lead.serviceType || '';
        let broadcastCount = 0;
        for (const [, conn] of this.connections) {
            const zipMatch = conn.zipCodes.length === 0 || conn.zipCodes.includes(leadZipCode);
            const serviceMatch = conn.serviceTypes.length === 0 || conn.serviceTypes.includes(leadServiceType);
            if (zipMatch && serviceMatch) {
                if (conn.ws.readyState === ws_1.WebSocket.OPEN) {
                    conn.ws.send(JSON.stringify({
                        type: 'new_lead',
                        lead: {
                            id: lead._id,
                            name: lead.name,
                            email: lead.email,
                            phone: lead.phone,
                            serviceType: lead.serviceType,
                            zipCode: lead.zipCode,
                            urgency: lead.urgency,
                            score: lead.score,
                            source: lead.source,
                            createdAt: lead.createdAt,
                        },
                        timestamp: new Date().toISOString(),
                    }));
                    broadcastCount++;
                }
            }
        }
        console.log(`[WebSocket] Broadcasted lead ${lead._id} to ${broadcastCount} contractors`);
    }
    notifyContractor(contractorId, message) {
        const wsSet = this.contractorConnections.get(contractorId);
        if (!wsSet || wsSet.size === 0) {
            console.log(`[WebSocket] No active connections for contractor ${contractorId}`);
            return false;
        }
        let sent = false;
        const payload = JSON.stringify({
            type: 'notification',
            ...((typeof message === 'object' && message !== null) ? message : { message }),
            timestamp: new Date().toISOString(),
        });
        for (const ws of wsSet) {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(payload);
                sent = true;
            }
        }
        return sent;
    }
    getStats() {
        return {
            totalConnections: this.connections.size,
            uniqueContractors: this.contractorConnections.size,
        };
    }
}
exports.LeadWebSocket = LeadWebSocket;
//# sourceMappingURL=LeadWebSocket.js.map