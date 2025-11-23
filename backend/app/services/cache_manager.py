"""
Redis cache manager for performance optimization.
"""
import redis
import json
import logging
from typing import Any, Optional
from datetime import timedelta

logger = logging.getLogger(__name__)

# Redis connection
try:
    redis_client = redis.Redis(
        host='localhost',  # Will be 'redis' in Docker
        port=6379,
        db=0,
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Redis connection established")
except redis.ConnectionError:
    logger.warning("Redis not available, caching disabled")
    redis_client = None


def get_cache(key: str) -> Optional[Any]:
    """
    Retrieve cached data by key.
    
    Args:
        key: Cache key
    
    Returns:
        Cached value or None if not found/expired
    """
    if not redis_client:
        return None
    
    try:
        value = redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        logger.error(f"Cache get error for key {key}: {e}")
        return None


def set_cache(key: str, value: Any, ttl: int = 300) -> bool:
    """
    Store data in cache with TTL.
    
    Args:
        key: Cache key
        value: Data to cache (must be JSON serializable)
        ttl: Time to live in seconds (default: 5min)
    
    Returns:
        bool: True if cached successfully
    """
    if not redis_client:
        return False
    
    try:
        json_value = json.dumps(value)
        redis_client.setex(key, ttl, json_value)
        return True
    except Exception as e:
        logger.error(f"Cache set error for key {key}: {e}")
        return False


def invalidate_cache(pattern: str) -> int:
    """
    Invalidate cache entries matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "user:*")
    
    Returns:
        int: Number of keys deleted
    """
    if not redis_client:
        return 0
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            return redis_client.delete(*keys)
        return 0
    except Exception as e:
        logger.error(f"Cache invalidation error for pattern {pattern}: {e}")
        return 0


def delete_cache(key: str) -> bool:
    """Delete a specific cache key."""
    if not redis_client:
        return False
    
    try:
        redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Cache delete error for key {key}: {e}")
        return False


# Cache key generators
def user_profile_key(user_id: str) -> str:
    """Generate cache key for user profile."""
    return f"user:profile:{user_id}"


def tier_status_key(user_id: str) -> str:
    """Generate cache key for tier status."""
    return f"user:tier:{user_id}"


def match_report_key(resume_id: str, job_desc_hash: str) -> str:
    """Generate cache key for match report."""
    return f"match_report:{resume_id}:{job_desc_hash}"


def problem_key(problem_id: str) -> str:
    """Generate cache key for coding problem."""
    return f"problem:{problem_id}"


# TTL constants (in seconds)
TTL_USER_PROFILE = 900      # 15 minutes
TTL_TIER_STATUS = 300        # 5 minutes
TTL_MATCH_REPORT = 1800      # 30 minutes
TTL_PROBLEM = 3600           # 1 hour
TTL_QUESTION_BANK = 7200     # 2 hours
