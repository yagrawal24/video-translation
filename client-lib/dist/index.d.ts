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
export declare class VideoTranslationClient {
    private axios;
    /**
     * Create a new client.
     *
     * @param baseURL The base URL of the API.
     */
    constructor(baseURL: string);
    /**
     * Get the current status of the job by ID.
     *
     * @param jobId The ID of the job to get the status of.
     * @returns The current status of the job.
     */
    getStatus(jobId: string): Promise<JobStatus>;
    /**
     * Poll until the job is completed or error, with exponential backoff (and optional jitter).
     * Also supports maxTotalTimeMs for an overall timeout.
     *
     * @param jobId The ID of the job to poll.
     * @param options The options for the poll.
     * @returns The final status of the job.
     */
    waitForJobCompletion(jobId: string, options?: PollOptions): Promise<JobStatus>;
}
