import { spawn, ChildProcess } from 'child_process';
import { VideoTranslationClient } from '../src/index';
import path from 'path';

describe('Integration Test: FastAPI + VideoTranslationClient', () => {
    let serverProcess: ChildProcess | undefined;

    beforeAll(async () => {
        const serverDir = path.resolve(__dirname, '../../server');
        serverProcess = spawn(
            'uvicorn',
            ['app.main:app', '--port', '8000', '--host', '0.0.0.0', '--reload'],
            {
                cwd: serverDir,
                shell: true,
            }
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));
    });

    afterAll(() => {
        if (serverProcess) {
            serverProcess.kill();
        }
    });

    test('Waits for job completion with real server', async () => {
        const client = new VideoTranslationClient('http://localhost:8000');
        const jobId = 'integration-test-job3';

        console.log(`Starting integration test for jobId=${jobId}`);

        const finalStatus = await client.waitForJobCompletion(jobId, {
            maxAttempts: 10,
            initialDelayMs: 1000,
            maxDelayMs: 3000,
            backoffFactor: 1.5,
            onPoll: (attempt, status) => {
                console.log(`Attempt #${attempt} => status: ${status}`);
            },
        });

        console.log(`Final status for '${jobId}': ${finalStatus}`);

        expect(['completed', 'error']).toContain(finalStatus);
    }, 30000);
});

