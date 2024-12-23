import os
import time
import random
import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from redis_client import r

logging.basicConfig(level=logging.INFO)

load_dotenv()

origins = [
    "http://localhost:3000",
]

MAX_REQUESTS_PER_MINUTE = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "5"))
RATE_LIMIT_EXPIRATION = int(os.getenv("RATE_LIMIT_EXPIRATION", "60"))
ERROR_PROBABILITY = float(os.getenv("ERROR_PROBABILITY", "0.1"))
MIN_DURATION_SECONDS = int(os.getenv("MIN_DURATION_SECONDS", "1"))
MAX_DURATION_SECONDS = int(os.getenv("MAX_DURATION_SECONDS", "10"))

app = FastAPI(
    title="Video Translation Simulator",
    description="A FastAPI server simulating an AI-powered video translation job with random durations and error probabilities.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def rate_limiter(request: Request, call_next):
    """
    A simple Redis-based rate limiter.
    Each IP can make up to MAX_REQUESTS_PER_MINUTE requests within RATE_LIMIT_EXPIRATION seconds.
    """
    client_ip = request.client.host
    ip_key = f"ratelimit:{client_ip}"

    current_count = r.incr(ip_key)
    if current_count == 1:
        r.expire(ip_key, RATE_LIMIT_EXPIRATION)

    if current_count > MAX_REQUESTS_PER_MINUTE:
        logging.warning(f"Rate limit exceeded for IP={client_ip}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded. Try again later."}
        )

    return await call_next(request)

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify the server is up.
    """
    return {"status": "ok"}


@app.get("/")
def root():
    """
    Root endpoint.
    """
    return {"message": "Hello from the Video Translation Simulator!"}

@app.get("/status")
def get_translation_status(job_id: str = "job123"):
    """
    Simulates a video translation job with a random duration [MIN_DURATION_SECONDS, MAX_DURATION_SECONDS].
    - If the job_id is brand new, we set 'pending' status, a start_time, and a random job_duration in Redis.
    - If the elapsed time since start_time is under job_duration => "pending".
    - If we've passed job_duration => "completed" (permanently).
    - On ANY request, there's a ERROR_PROBABILITY chance we return "error" (permanently).
    """

    status_key = f"job:{job_id}:status"
    start_time_key = f"job:{job_id}:start_time"
    duration_key = f"job:{job_id}:duration"

    existing_status = r.get(status_key)
    if existing_status is not None:
        existing_status = existing_status.decode("utf-8")

        if existing_status in ("error", "completed"):
            return {"result": existing_status}

    if random.random() < ERROR_PROBABILITY:
        r.set(status_key, "error")
        logging.info(f"job_id={job_id} returning error (random error).")
        return {"result": "error"}

    start_time = r.get(start_time_key)
    job_duration = r.get(duration_key)

    if not start_time or not job_duration:
        now = time.time()
        r.set(start_time_key, now)

        assigned_duration = random.randint(MIN_DURATION_SECONDS, MAX_DURATION_SECONDS)
        r.set(duration_key, assigned_duration)

        r.set(status_key, "pending")
        logging.info(f"Initialized new job_id={job_id}, duration={assigned_duration}s.")
        return {"result": "pending"}

    start_time = float(start_time)
    job_duration = int(job_duration)

    elapsed = time.time() - start_time

    if elapsed < job_duration:
        r.set(status_key, "pending")
        return {"result": "pending"}
    else:
        r.set(status_key, "completed")
        logging.info(f"job_id={job_id} completed after {elapsed:.1f}s (duration={job_duration}s).")
        return {"result": "completed"}


