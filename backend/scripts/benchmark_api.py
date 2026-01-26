import requests
import time
import concurrent.futures

BASE_URL = "http://localhost:8000"

def check_health():
    start = time.time()
    try:
        resp = requests.get(f"{BASE_URL}/health")
        latency = (time.time() - start) * 1000
        print(f"[Health] Status: {resp.status_code} | Latency: {latency:.2f}ms")
        return latency
    except Exception as e:
        print(f"[Health] Failed: {e}")
        return None

def stress_test_health(n=50):
    print(f"\n--- Stress Testing /health with {n} concurrent requests ---")
    start_total = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        latencies = list(executor.map(lambda _: check_health(), range(n)))
    
    valid_latencies = [l for l in latencies if l is not None]
    avg = sum(valid_latencies) / len(valid_latencies)
    total_time = time.time() - start_total
    print(f"Total Time: {total_time:.2f}s | Avg Latency: {avg:.2f}ms | throughput: {n/total_time:.1f} req/s")

if __name__ == "__main__":
    print("Running API Benchmark...")
    check_health()
    stress_test_health()
