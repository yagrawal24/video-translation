"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoTranslationClient = void 0;
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
            if (status === 'completed' || status === 'error') {
                return status;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * backoffFactor, maxDelayMs);
        }
        throw new Error(`Job ${jobId} still not completed after ${maxAttempts} attempts`);
    }
}
exports.VideoTranslationClient = VideoTranslationClient;
