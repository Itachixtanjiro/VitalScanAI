import asyncio
from typing import Optional, Any

class MockRedis:
    """
    A simple in-memory cache that mimics the async Redis interface.
    Used for development/prototype when a real Redis server is not available.
    """
    def __init__(self):
        self._cache = {}

    async def get(self, key: str) -> Optional[str]:
        return self._cache.get(key)

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        self._cache[key] = value
        # In a real implementation we would handle TTL, but for this mock we'll ignore it
        # or implement a simple cleanup if needed. For now, simple dict is fine.
        if ttl:
            # Optionally schedule deletion? 
            # For a prototype, letting it persist in memory is acceptable.
            pass
        return True

    async def close(self):
        pass

# Instantiate a global client
redis_client = MockRedis()
