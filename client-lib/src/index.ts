import axios, { AxiosInstance } from 'axios';

export type JobStatus = 'pending' | 'completed' | 'error';

export interface PollOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  onPoll?: (attempt: number, status: JobStatus) => void;
}

export class VideoTranslationClient {
    private axios: AxiosInstance;

    constructor(baseURL: string) {
        this.axios = axios.create({
            baseURL
        });
    }

    /**
     * Get the current status of the job by ID
     */
    public async getStatus(jobId: string): Promise<JobStatus> {
        const response = await this.axios.get('/status', {
            params: { job_id: jobId }
        });
        return response.data.result as JobStatus;
    }

    /**
     * Poll until the job is completed or error, with exponential backoff to avoid spamming
     */
    public async waitForJobCompletion(
        jobId: string,
        options: PollOptions = {}
    ): Promise<JobStatus> {
        const {
            maxAttempts = 10,
            initialDelayMs = 1000,
            maxDelayMs = 10000,
            backoffFactor = 2,
            onPoll
        } = options;

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

