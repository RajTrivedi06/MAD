import json
import logging
from typing import Optional, Any, Dict
import redis.asyncio as redis
from datetime import timedelta

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.default_ttl = 3600  # 1 hour default
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get value from cache"""
        try:
            cached_value = await self.redis.get(key)
            if cached_value:
                logger.info(f"Cache hit for key: {key}")
                return json.loads(cached_value)
            logger.info(f"Cache miss for key: {key}")
            return None
        except Exception as e:
            logger.error(f"Error getting from cache: {str(e)}")
            return None
    
    async def set(self, key: str, value: Dict[str, Any], ttl: int = None) -> bool:
        """Set value in cache with optional TTL"""
        try:
            ttl = ttl or self.default_ttl
            serialized_value = json.dumps(value, default=str)
            await self.redis.setex(key, ttl, serialized_value)
            logger.info(f"Cached value for key: {key} with TTL: {ttl}s")
            return True
        except Exception as e:
            logger.error(f"Error setting cache: {str(e)}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            await self.redis.delete(key)
            logger.info(f"Deleted cache key: {key}")
            return True
        except Exception as e:
            logger.error(f"Error deleting from cache: {str(e)}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            return await self.redis.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking cache existence: {str(e)}")
            return False
    
    async def get_ttl(self, key: str) -> int:
        """Get remaining TTL for a key"""
        try:
            return await self.redis.ttl(key)
        except Exception as e:
            logger.error(f"Error getting TTL: {str(e)}")
            return -1
    
    def generate_key(self, prefix: str, *args) -> str:
        """Generate cache key from prefix and arguments"""
        return f"{prefix}:{':'.join(str(arg) for arg in args)}"
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching a pattern"""
        try:
            keys = await self.redis.keys(pattern)
            if keys:
                await self.redis.delete(*keys)
                logger.info(f"Invalidated {len(keys)} keys matching pattern: {pattern}")
                return len(keys)
            return 0
        except Exception as e:
            logger.error(f"Error invalidating pattern: {str(e)}")
            return 0

# Cache key generators for specific use cases
class PrerequisiteCacheKeys:
    @staticmethod
    def graph(course_id: int, include_user_progress: bool = False) -> str:
        """Generate cache key for prerequisite graph"""
        return f"prereq_graph:{course_id}:progress_{include_user_progress}"
    
    @staticmethod
    def stats(course_id: int) -> str:
        """Generate cache key for prerequisite statistics"""
        return f"prereq_stats:{course_id}"
    
    @staticmethod
    def tree(course_id: int) -> str:
        """Generate cache key for prerequisite tree"""
        return f"prereq_tree:{course_id}"
    
    @staticmethod
    def eligibility(course_id: int, user_id: str) -> str:
        """Generate cache key for user eligibility"""
        return f"prereq_eligibility:{course_id}:{user_id}"
    
    @staticmethod
    def course_metadata(course_id: int) -> str:
        """Generate cache key for course metadata"""
        return f"course_metadata:{course_id}"

# Cache TTL constants
class CacheTTL:
    PREREQ_GRAPH = 3600  # 1 hour
    PREREQ_STATS = 7200  # 2 hours
    PREREQ_TREE = 7200   # 2 hours
    ELIGIBILITY = 1800   # 30 minutes
    COURSE_METADATA = 86400  # 24 hours
    USER_PROGRESS = 900  # 15 minutes 