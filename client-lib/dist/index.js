"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoTranslationClient = void 0;
// client-lib/src/index.ts
const axios_1 = __importDefault(require("axios"));
class VideoTranslationClient {
    constructor(baseURL) {
        this.axios = axios_1.default.create({
            baseURL
        });
    }
    /**
     * Get the current status of the job by ID
     */
    async getStatus(jobId) {
        // Example: GET /status?job_id=someId
        // The server will return { result: 'pending' | 'completed' | 'error' }
        const response = await this.axios.get('/status', {
            params: { job_id: jobId }
        });
        return response.data.result;
    }
    /**
     * Poll until the job is completed or error, with exponential backoff to avoid spamming
     */
    async waitForJobCompletion(jobId, options = {}) {
        const { maxAttempts = 10, initialDelayMs = 1000, maxDelayMs = 10000, backoffFactor = 2, onPoll } = options;
        let attempt = 0;
        let delay = initialDelayMs;
        while (attempt < maxAttempts) {
            attempt++;
            const status = await this.getStatus(jobId);
            if (onPoll) {
                onPoll(attempt, status);
            }
            // If we are completed or error, return immediately
            if (status === 'completed' || status === 'error') {
                return status;
            }
            // Not done yet => wait and try again
            await new Promise(resolve => setTimeout(resolve, delay));
            // Exponential backoff, clamped by maxDelayMs
            delay = Math.min(delay * backoffFactor, maxDelayMs);
        }
        // If we reached maxAttempts, give up
        throw new Error(`Job ${jobId} still not completed after ${maxAttempts} attempts`);
    }
}
exports.VideoTranslationClient = VideoTranslationClient;
