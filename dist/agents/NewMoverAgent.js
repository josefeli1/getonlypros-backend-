"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewMoverAgent = void 0;
const BaseAgent_1 = require("./BaseAgent");
class NewMoverAgent extends BaseAgent_1.BaseAgent {
    constructor() {
        super(...arguments);
        this.slug = 'new-mover';
        this.name = 'New Mover Agent';
        this.category = 'monitoring';
        this.defaultSchedule = '0 7 * * *';
    }
    async run(context) {
        console.log(`[${this.slug}] Scanning for new movers...`);
        const leadsGenerated = 0;
        return {
            success: true,
            leadsGenerated,
            message: `New mover scan completed. ${leadsGenerated} leads generated.`,
        };
    }
}
exports.NewMoverAgent = NewMoverAgent;
//# sourceMappingURL=NewMoverAgent.js.map