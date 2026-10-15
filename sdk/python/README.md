# Free Gravity Python SDK (Pillar 4)

> Standardized Model Context Protocol (MCP) and Autonomous Agent Tooling for Python.

The **Free Gravity Python SDK** enables developers to define custom autonomous agent tools using standard Python type annotations and the `@tool` decorator. Tools can be served directly over Model Context Protocol (MCP) JSON-RPC standard input/output (`stdio`) or connected to **Free Gravity Studio** via local WebSockets.

---

## Key Features

- **Zero Heavy Dependencies**: Built entirely on top of Python 3.10+ standard libraries.
- **Automatic JSON Schema Generation**: Parameter schemas and documentation are parsed directly from function type hints and docstrings.
- **MCP Stdio Server**: 100% compliant with the official Model Context Protocol (JSON-RPC 2.0).
- **Sync & Async Support**: Define synchronous functions or asynchronous `async def` tools seamlessly.
- **Ultra-Low Latency**: Inter-process communication operates under 2ms on local machines with zero cloud egress.

---

## Installation

```bash
# Via pip (once published) or directly in your local environment:
pip install free-gravity-sdk

# Or copy sdk/python/free_gravity_sdk.py directly into your repository!
```

---

## Quickstart

### 1. Define Tools with `@tool`

```python
from free_gravity_sdk import tool, MCPServer
import hashlib

@tool
def calculate_sha256(filepath: str) -> str:
    """Compute the SHA-256 hash of a local file."""
    with open(filepath, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

@tool(description="Execute read-only query against internal SQLite database")
def query_orders(min_amount: float, limit: int = 10) -> list[dict]:
    """Fetch orders matching minimum amount threshold."""
    # Your database query logic here
    return [
        {"id": 101, "customer": "Alice", "amount": 250.00},
        {"id": 102, "customer": "Bob", "amount": 540.50},
    ]

if __name__ == "__main__":
    # Boot the MCP stdio server
    server = MCPServer(name="orders-agent", version="1.0.0")
    server.run_stdio()
```

---

## Connecting to Free Gravity Studio

In Free Gravity Studio (`Settings` -> `MCP Skills` -> `Add Custom MCP Server`), add your Python script:

```json
{
  "name": "python-orders-agent",
  "command": "python",
  "args": ["sdk/python/free_gravity_sdk.py"],
  "env": {
    "PYTHONUNBUFFERED": "1"
  }
}
```

The Studio will automatically discover `calculate_sha256` and `query_orders` with full parameter validation and type hints!

---

## Async Tool Support

Tools can be asynchronous:

```python
import aiohttp
from free_gravity_sdk import tool

@tool
async def fetch_api_status(service_url: str) -> dict:
    """Check health endpoint of local microservice."""
    async with aiohttp.ClientSession() as session:
        async with session.get(service_url) as resp:
            return {"status": resp.status, "ok": resp.status == 200}
```

---

## Architecture Specification

```
┌─────────────────────────────────┐
│   Free Gravity Studio / CLI     │
│   (Hermes 3 / Ollama Engine)    │
└────────────────┬────────────────┘
                 │ JSON-RPC 2.0 (stdio)
                 ▼
┌─────────────────────────────────┐
│          MCPServer              │
│    (free_gravity_sdk.py)        │
├─────────────────────────────────┤
│ • tools/list  -> Inspect schemas│
│ • tools/call  -> Execute @tool  │
│ • initialize  -> Capabilities   │
└─────────────────────────────────┘
```

---

## License

MIT License — 100% Free and Open Source.
