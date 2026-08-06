# Helpdesk System Customization Rules

## n8n Workflow Configuration
When building or updating n8n workflows for this project, always use the following configurations:
1. **Switch Node (Route by Category)**:
   * Use **typeVersion: 3.2** (or higher).
   * Rules are configured under `"rules": { "values": [ ... ] }`.
   * Explicitly set the output keys as strings (`"outputKey": "Network"`, `"outputKey": "Hardware"`, etc.).
2. **Set Nodes**:
   * Use **typeVersion: 3.4** (or higher).
   * Assignments are configured under `"assignments": { "assignments": [ ... ] }`.
3. **Database Team Names**:
   Always match the exact names set in the n8n workflows:
   * `Network Team`
   * `Hardware Team`
   * `Software Team`
   * `Access Team`
   * `Billing Team`
   * `General Support`
