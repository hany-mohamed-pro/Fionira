# AG-RAPID-S1: Isolated Test Environment & Safety Proof

## 1. Safety Architecture
To comply with the absolute data isolation rule, the sprint designed and implemented a runtime sandbox routing system:
- **Header-driven Isolation**: The header `X-Sprint-Mode: AG-RAPID-S1` dynamically switches the storage context at the request level.
- **Dynamic DB Routing**: A Proxy traps all accesses to the dev memory databases (`devMemoryDb`) and redirects them to the isolated sandboxed storage object `devMemoryDbSprint`.
- **Sandbox File Pathing**: Path resolution methods `getUploadsFile()`, `getRegistryFile()`, `getGovernanceFile()`, and `getStagedDir()` redirect all file read/write operations to:
  - `data/rapid-s1/uploads.json`
  - `data/rapid-s1/erp_registry.json`
  - `data/rapid-s1/governance_requests.json`
  - `data/rapid-s1/staged-files/`
- **Multer Context Preservation**: Wrapped the asynchronous multer upload callback to guarantee the `AsyncLocalStorage` context propagates correctly into Express route handlers.

## 2. Reset and Re-run Capability
The sandboxed database exposes a clean reset route:
- **API Endpoint**: `POST /api/erp/dev/rapid-s1/reset`
- **Methodology**: Wipes the sandboxed databases (`devMemoryDbSprint`) in memory, unlinks files under `data/rapid-s1/` and deletes all files in `data/rapid-s1/staged-files/`.
- This resets the environment to a clean state without restarting the server or affecting production databases.
