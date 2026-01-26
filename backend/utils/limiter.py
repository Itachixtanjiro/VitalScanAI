import time
from collections import defaultdict, deque

class RateLimiter:
    """
    Simple in-memory sliding window rate limiter.
    """
    def __init__(self):
        self._requests = defaultdict(deque)

    def is_allowed(self, user_id: str, limit: int, window_sec: int = 60) -> bool:
        now = time.time()
        window_start = now - window_sec
        
        user_history = self._requests[user_id]
        
        # Remove old requests
        while user_history and user_history[0] < window_start:
            user_history.popleft()
            
        if len(user_history) < limit:
            user_history.append(now)
            return True
            
        return False

limiter = RateLimiter()
