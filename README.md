# Video Translation Simulator

A project that simulates a video translation service with a FastAPI server, TypeScript client library, and React client application. The system demonstrates handling of long-running jobs with status polling, error handling, and exponential backoff.

## Architecture

### Server (FastAPI)

The server simulates video translation jobs with configurable durations and error rates:

-   **Random Job Durations**: Each job is assigned a random completion time
-   **Configurable Error Rates**: Status checks can randomly return errors based on probability settings
-   **Persistent State**: Job states are maintained in Redis
-   **Rate Limiting**: Configurable request limits by IP to prevent server overload

#### Endpoints

-   `GET /status?job_id={id}` - Get or create a job's status
    -   Returns: `{"result": "pending" | "completed" | "error"}`
-   `GET /` - Health check endpoint
    -   Returns: `{"message": "Hello from the Video Translation Simulator!"}`

#### Redis Implementation

-   Stores job metadata including:
    -   Start time
    -   Duration
    -   Current status
-   Data persists unless manually cleared or configured with expiration

#### Environment Configuration

```
REDIS_HOST=localhost
REDIS_PORT=6379
MIN_DURATION_SECONDS=2
MAX_DURATION_SECONDS=10
ERROR_PROBABILITY=0.1
MAX_REQUESTS_PER_MINUTE=5
RATE_LIMIT_EXPIRATION=60
```

### Client Library (TypeScript)

Provides a convenient interface for interacting with the server API:

#### Core Functions

1. `getStatus(jobId: string): Promise<string>`

    - Single status check for a job
    - Returns: `"pending"`, `"completed"`, or `"error"`

2. `waitForJobCompletion(jobId: string, options?: PollOptions): Promise<string>`
    - Polls until job completion with exponential backoff
    - Returns final status: `"completed"` or `"error"`

#### Configuration Options

```typescript
interface PollOptions {
    maxAttempts?: number; // Default: 10
    initialDelayMs?: number; // Default: 1000
    maxDelayMs?: number; // Default: 10000
    backoffFactor?: number; // Default: 2
    onPoll?: (attemptNumber: number, status: string) => void;
}
```

#### Usage Example

```typescript
import { VideoTranslationClient } from "video-translation-client";

const client = new VideoTranslationClient("http://localhost:8000");

// Single status check
const status = await client.getStatus("myVideo");

// Wait for completion with progress updates
const finalStatus = await client.waitForJobCompletion("myVideo", {
    maxAttempts: 10,
    initialDelayMs: 1000,
    onPoll: (attempt, status) => console.log(`Poll #${attempt}: ${status}`),
});
```

#### Testing Strategy

The client library implements a comprehensive testing approach with two types of tests:

1. **Unit Tests** (`index.test.ts`)

    - Tests individual client methods in isolation
    - Uses Jest mocking to simulate API responses
    - Verifies behavior for different scenarios:
        - Successful status retrieval
        - Job completion polling
        - Error handling
        - Callback execution
        - Maximum attempts handling

2. **Integration Tests** (`integration.test.ts`)
    - Tests the client library against a live FastAPI server
    - Spawns a local server instance during test execution
    - Verifies end-to-end functionality:
        - Real HTTP requests
        - Actual job status progression
        - Exponential backoff behavior
    - Includes detailed logging for debugging
    - Uses longer timeouts to accommodate real processing times

### Client Application (React)

Demonstrates practical usage of the client library with a simple UI:

-   Job ID input field
-   Single status check button
-   "Wait for completion" button with progress updates
-   Status display area

## Getting Started

### Server Setup

```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --host 0.0.0.0 --reload
```

NOTE: If using conda, one might face a known issue with conda and typing-extensions where module typing-extensions is not found. Best fix is to

```bash
conda install typing-extensions
```

### Client Library Setup

```bash
cd client-lib
npm install
npm run build
```

### Client Application Setup

```bash
cd client
npm install
npm run dev
```

Access the application at `http://localhost:3000`

## Key Features

-   Simulated processing times with random durations
-   Configurable error rates for testing error handling
-   Exponential backoff to prevent server overload
-   Rate limiting for API protection
-   Persistent job state storage in Redis
-   TypeScript client library with flexible configuration
-   React demo application showing practical usage
