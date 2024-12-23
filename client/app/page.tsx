"use client";

import React, { useState } from 'react';
import { VideoTranslationClient, JobStatus } from 'video-translation-client';

const client = new VideoTranslationClient('http://localhost:8000');

export default function HomePage() {
    const [jobId, setJobId] = useState('job123');
    const [status, setStatus] = useState<JobStatus | ''>('');
    const [logs, setLogs] = useState<string[]>([]);

    const handleCheckStatus = async () => {
        try {
            setLogs(prev => [...prev, `Checking status for ${jobId}...`]);
            const result = await client.getStatus(jobId);
            setStatus(result);
            setLogs(prev => [...prev, `Current status: ${result}`]);
        } catch (err) {
            setLogs(prev => [...prev, `Error calling getStatus: ${err}`]);
        }
    };

    const handleWaitForCompletion = async () => {
        setLogs([]);
        setStatus('');
        try {
            setLogs(prev => [...prev, `Waiting for job ${jobId} to complete...`]);
            const finalStatus = await client.waitForJobCompletion(jobId, {
                maxAttempts: 10,
                initialDelayMs: 1000,
                maxDelayMs: 8000,
                backoffFactor: 2,
                jitter: true,
                maxTotalTimeMs: 30000,
                onPoll: (attempt, s) => {
                    setLogs(prev => [...prev, `Attempt #${attempt}: status = ${s}`]);
                },
            });
            setStatus(finalStatus);
            setLogs(prev => [...prev, `Final status: ${finalStatus}`]);
        } catch (err) {
            setLogs(prev => [...prev, `Polling error: ${err}`]);
        }
    };

    return (
        <div className="mx-auto my-8 max-w-2xl font-sans">
            <h1 className="text-2xl font-semibold mb-6 text-center">
                Video Translation Demo
            </h1>

            <div className="mb-4 flex items-center space-x-2">
                <label htmlFor="jobId" className="font-medium">
                    Job ID:
                </label>
                <input
                    type="text"
                    id="jobId"
                    className="border border-gray-300 rounded p-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                />
            </div>

            <div className="mb-4 space-x-2">
                <button
                    onClick={handleCheckStatus}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Check Status
                </button>
                <button
                    onClick={handleWaitForCompletion}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Wait for Completion
                </button>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-semibold">Current Status: {status}</h2>
                <h3 className="text-md font-medium mt-4">Logs:</h3>
                <div className="bg-gray-100 rounded p-2 h-48 overflow-y-auto mt-2">
                    <pre className="text-sm whitespace-pre-wrap">
                        {logs.join('\n')}
                    </pre>
                </div>
            </div>
        </div>
    );
}