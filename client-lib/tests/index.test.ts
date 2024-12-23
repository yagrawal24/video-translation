import axios, { AxiosInstance } from 'axios';
import { VideoTranslationClient } from '../src';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('VideoTranslationClient', () => {
    let client: VideoTranslationClient;
    let axiosInstance: jest.Mocked<AxiosInstance>;

    beforeEach(() => {
        axiosInstance = {
            get: jest.fn(),
        } as unknown as jest.Mocked<AxiosInstance>;

        mockedAxios.create.mockReturnValue(axiosInstance);

        client = new VideoTranslationClient('https://fake-url');
    });

    describe('getStatus', () => {
        it('should return the correct status from the server', async () => {
            axiosInstance.get.mockResolvedValueOnce({ data: { result: 'pending' } });
            const status = await client.getStatus('job123');
            expect(status).toBe('pending');
            expect(axiosInstance.get).toHaveBeenCalledWith('/status', {
                params: { job_id: 'job123' },
            });
        });
    });

    describe('waitForJobCompletion', () => {
        it('should return completed if the job eventually completes', async () => {
            axiosInstance.get
                .mockResolvedValueOnce({ data: { result: 'pending' } })
                .mockResolvedValueOnce({ data: { result: 'pending' } })
                .mockResolvedValueOnce({ data: { result: 'completed' } });

            const result = await client.waitForJobCompletion('job123', {
                maxAttempts: 5,
                initialDelayMs: 10,
            });

            expect(result).toBe('completed');
            expect(axiosInstance.get).toHaveBeenCalledTimes(3);
        });

        it('should throw an error if the job is never completed after maxAttempts', async () => {
            axiosInstance.get.mockResolvedValue({ data: { result: 'pending' } });

            await expect(
                client.waitForJobCompletion('job456', {
                    maxAttempts: 3,
                    initialDelayMs: 10,
                })
            ).rejects.toThrow('still not completed after 3 attempts');

            expect(axiosInstance.get).toHaveBeenCalledTimes(3);
        });

        it('should return immediately if the job is error', async () => {
            axiosInstance.get.mockResolvedValueOnce({ data: { result: 'error' } });

            const status = await client.waitForJobCompletion('job789');
            expect(status).toBe('error');
            expect(axiosInstance.get).toHaveBeenCalledTimes(1);
        });

        it('should call onPoll callback each time', async () => {
            axiosInstance.get
                .mockResolvedValueOnce({ data: { result: 'pending' } })
                .mockResolvedValueOnce({ data: { result: 'completed' } });

            const onPollMock = jest.fn();
            await client.waitForJobCompletion('job-with-callback', {
                onPoll: onPollMock,
                initialDelayMs: 5,
            });

            expect(onPollMock).toHaveBeenCalledTimes(2);
            expect(onPollMock).toHaveBeenNthCalledWith(1, 1, 'pending');
            expect(onPollMock).toHaveBeenNthCalledWith(2, 2, 'completed');
        });
    });
});

