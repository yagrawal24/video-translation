import axios, { AxiosInstance } from 'axios';

export type JobStatus = 'pending' | 'completed' | 'error';

/**
 * Options for {@link VideoTranslationClient.waitForJobCompletion}.
 */
export interface PollOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    jitter?: boolean;
    maxTotalTimeMs?: number;
    onPoll?: (attempt: number, status: JobStatus) => void;
}

/**
 * A client for interacting with the video translation API.
 */
export class VideoTranslationClient {
    private axios: AxiosInstance;

    /**
     * Create a new client.
     *
     * @param baseURL The base URL of the API.
     */
    constructor(baseURL: string) {
        this.axios = axios.create({ baseURL });
    }

    /**
     * Get the current status of the job by ID.
     *
     * @param jobId The ID of the job to get the status of.
     * @returns The current status of the job.
     */
    public async getStatus(jobId: string): Promise<JobStatus> {
        const response = await this.axios.get('/status', {
            params: { job_id: jobId }
        });
        return response.data.result as JobStatus;
    }

    /**
     * Poll until the job is completed or error, with exponential backoff (and optional jitter).
     * Also supports maxTotalTimeMs for an overall timeout.
     *
     * @param jobId The ID of the job to poll.
     * @param options The options for the poll.
     * @returns The final status of the job.
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
            jitter = false,
            maxTotalTimeMs,
            onPoll
        } = options;

        let attempt = 0;
        let delay = initialDelayMs;

        const startTime = Date.now();

        while (attempt < maxAttempts) {
            if (maxTotalTimeMs && (Date.now() - startTime) >= maxTotalTimeMs) {
                throw new Error(
                    `Job ${jobId} not completed within maxTotalTimeMs (${maxTotalTimeMs}ms).`
                );
            }

            attempt++;
            const status = await this.getStatus(jobId);

            if (onPoll) {
                onPoll(attempt, status);
            }

            if (status === 'completed' || status === 'error') {
                return status;
            }

            await new Promise(resolve => setTimeout(resolve, delay));

            let nextDelay = delay * backoffFactor;
            if (jitter) {
                const randomFactor = 0.5 + Math.random(); 
                nextDelay = nextDelay * randomFactor;
            }

            delay = Math.min(nextDelay, maxDelayMs);
        }

        throw new Error(`Job ${jobId} still not completed after ${maxAttempts} attempts`);
    }
}
