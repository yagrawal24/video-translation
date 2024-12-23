"use client";

import React, { useState } from 'react';
import { VideoTranslationClient, JobStatus } from 'video-translation-client';

const client = new VideoTranslationClient('http://localhost:8000');

export default function HomePage() {
    const [jobId, setJobId] = useState('job123'); // default
    const [status, setStatus] = useState<JobStatus | ''>('');
    const [logs, setLogs] = useState<string[]>([]);

    const handleCheckStatus = async () => {
        try {
            setLogs((prev) => [...prev, `Checking status for ${jobId}...`]);
            const result = await client.getStatus(jobId);
            setStatus(result);
            setLogs((prev) => [...prev, `Current status: ${result}`]);
        } catch (err) {
            setLogs((prev) => [...prev, `Error calling getStatus: ${err}`]);
        }
    };

    const handleWaitForCompletion = async () => {
        setLogs([]);
        setStatus('');
        try {
            setLogs((prev) => [...prev, `Waiting for job ${jobId} to complete...`]);
            const finalStatus = await client.waitForJobCompletion(jobId, {
                maxAttempts: 10,
                initialDelayMs: 1000,
                maxDelayMs: 8000,
                backoffFactor: 2,
                onPoll: (attempt, s) => {
                    setLogs((prev) => [...prev, `Attempt #${attempt}: status = ${s}`]);
                }
            });
            setStatus(finalStatus);
            setLogs((prev) => [...prev, `Final status: ${finalStatus}`]);
        } catch (err) {
            setLogs((prev) => [...prev, `Polling error: ${err}`]);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
            <h1>Video Translation Demo</h1>
            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="jobId" style={{ marginRight: '0.5rem' }}>
                    Job ID:
                </label>
                <input
                    type="text"
                    id="jobId"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                />
            </div>

            <button onClick={handleCheckStatus} style={{ marginRight: '1rem' }}>
                Check Status
            </button>
            <button onClick={handleWaitForCompletion}>
                Wait for Completion
            </button>

            <div style={{ marginTop: '2rem' }}>
                <h2>Current Status: {status}</h2>
                <h3>Logs:</h3>
                <pre
                    style={{
                        background: '#f4f4f4',
                        padding: '1rem',
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}
                >
                    {logs.join('\n')}
                </pre>
            </div>
        </div>
    );
}

