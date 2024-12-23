export type JobStatus = 'pending' | 'completed' | 'error';
export interface PollOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    onPoll?: (attempt: number, status: JobStatus) => void;
}
export declare class VideoTranslationClient {
    private axios;
    constructor(baseURL: string);
    /**
     * Get the current status of the job by ID
     */
    getStatus(jobId: string): Promise<JobStatus>;
    /**
     * Poll until the job is completed or error, with exponential backoff to avoid spamming
     */
    waitForJobCompletion(jobId: string, options?: PollOptions): Promise<JobStatus>;
}
