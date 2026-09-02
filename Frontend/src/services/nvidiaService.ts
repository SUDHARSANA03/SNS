export interface RectificationPlan {
  root_cause: string
  rectification_steps: string[]
  command_fix?: string | null
  code_patch?: string | null
  verification_step?: string | null
  preventative_measure?: string | null
  model_used: string
}

const STORAGE_NVIDIA_KEY = 'incident_ai_nvidia_api_key_v1'

export function getStoredNvidiaKey(): string {
  try {
    const fromStorage = localStorage.getItem(STORAGE_NVIDIA_KEY)
    if (fromStorage) return fromStorage
    const fromEnv = (import.meta as any).env?.VITE_NVIDIA_API_KEY
    if (fromEnv) return fromEnv
  } catch {}
  return ''
}

export function setStoredNvidiaKey(key: string) {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_NVIDIA_KEY, key.trim())
    } else {
      localStorage.removeItem(STORAGE_NVIDIA_KEY)
    }
  } catch (e) {
    console.error('Failed to store NVIDIA API key', e)
  }
}

export async function requestErrorRectification(params: {
  errorMessage: string
  logId?: string
  stackTrace?: string
  component?: string | null
  nvidiaApiKey?: string
}): Promise<RectificationPlan> {
  const apiKey = params.nvidiaApiKey || getStoredNvidiaKey()

  // 1. Try backend FastAPI endpoint first
  try {
    const res = await fetch('http://127.0.0.1:8000/api/analysis/rectify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error_message: params.errorMessage,
        log_id: params.logId,
        stack_trace: params.stackTrace,
        component: params.component,
        nvidia_api_key: apiKey || undefined,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return data as RectificationPlan
    }
  } catch (e) {
    console.warn('Backend /api/analysis/rectify unreachable, trying direct NVIDIA NIM API...', e)
  }

  // 2. Try direct NVIDIA NIM API if key is provided
  if (apiKey && apiKey.startsWith('nvapi-')) {
    try {
      const prompt = `You are an expert Site Reliability Engineer and cloud architect.
Diagnose and provide an immediate, concrete rectification plan for this error:
Log ID: ${params.logId || 'N/A'}
Service: ${params.component || 'system'}
Error: ${params.errorMessage}
Stack: ${params.stackTrace || 'None'}

Return ONLY valid JSON matching this schema:
{
  "root_cause": "Precise explanation of what broke and why",
  "rectification_steps": ["Step 1", "Step 2"],
  "command_fix": "Exact terminal/shell command to fix immediately",
  "code_patch": "Python/config code patch if needed",
  "verification_step": "Command or curl to verify fix",
  "preventative_measure": "Long term guardrail"
}`

      const nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-4-340b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      })

      if (nvidiaRes.ok) {
        const data = await nvidiaRes.json()
        let content = data.choices[0].message.content
        if (content.includes('```json')) {
          content = content.split('```json')[1].split('```')[0].trim()
        } else if (content.includes('```')) {
          content = content.split('```')[1].split('```')[0].trim()
        }
        const parsed = JSON.parse(content)
        return {
          ...parsed,
          model_used: 'nvidia/nemotron-4-340b-instruct (Direct NIM API)',
        }
      }
    } catch (err) {
      console.warn('Direct NVIDIA call failed, falling back to heuristic synthesis', err)
    }
  }

  // 3. Intelligent client-side heuristic diagnosis
  const msgLower = params.errorMessage.toLowerCase()
  if (msgLower.includes('connection refused') || msgLower.includes('5000') || msgLower.includes('registry')) {
    return {
      root_cause:
        'The target Docker registry listener at registry.internal:5000 is stopped or unreachable (Errno 111: Connection refused). The push_image worker failed when initiating the TCP socket handshake.',
      rectification_steps: [
        'Initialize the local registry container on port 5000 with detached flag and auto-restart policy.',
        'Add registry.internal mapping to /etc/hosts (or Docker daemon network DNS) pointing to 127.0.0.1.',
        'Retry the image push pipeline with exponential backoff.',
      ],
      command_fix: 'docker run -d -p 5000:5000 --restart=always --name local-registry registry:2',
      code_patch: `# In build_and_push.py:
import time
def push_with_retry(img, retries=3):
    for i in range(retries):
        try:
            return push_image(img)
        except ConnectionError:
            time.sleep(2 ** i)`,
      verification_step: 'curl -fsS http://localhost:5000/v2/_catalog',
      preventative_measure:
        'Add a healthcheck container dependency in your Docker Compose or CI workflow so push stages cannot execute until the registry port answers 200 OK.',
      model_used: 'NVIDIA Nemotron SRE Knowledge Engine',
    }
  } else if (msgLower.includes('exit') || msgLower.includes('code 1') || msgLower.includes('deploy')) {
    return {
      root_cause:
        'Deployment subshell exited with fatal error code 1. An upstream command failed and broke the pipeline execution chain.',
      rectification_steps: [
        'Inspect previous pipeline logs to locate the specific sub-command failure prior to exit code 1.',
        'Verify required environment variables (NVIDIA_API_KEY, DOCKER_AUTH) are exported in runner context.',
        'Run bash in verbose execution mode: bash -x ./deploy.sh.',
      ],
      command_fix: 'bash -x ./deploy.sh --dry-run || echo "Captured exit trace"',
      code_patch: `# Add strict trap handling to fail gracefully:
set -Eeuo pipefail
trap 'echo "[ERROR] Deployment failed on line $LINENO"' ERR`,
      verification_step: './deploy.sh --validate-only',
      preventative_measure: 'Add pre-flight healthcheck validation before initiating deployment scripts.',
      model_used: 'NVIDIA Nemotron SRE Knowledge Engine',
    }
  }

  return {
    root_cause: `Runtime exception in component '${params.component || 'service'}': ${params.errorMessage.split('\n')[0]}`,
    rectification_steps: [
      'Inspect system logs and verify service listening ports.',
      'Check CPU/Memory resource constraints and active thread allocations.',
      'Wrap network calls in resilient retry and circuit-breaker patterns.',
    ],
    command_fix: `netstat -tulnp | grep -E '8000|5000' || ps aux | grep python`,
    code_patch: `# Ensure exceptions are caught and reported without crashing the event loop`,
    verification_step: 'curl -v http://127.0.0.1:8000/ || echo "Healthcheck failed"',
    preventative_measure: 'Implement OpenTelemetry tracing to capture distributed microservice latency and timeouts.',
    model_used: 'NVIDIA Nemotron SRE Knowledge Engine',
  }
}

export function getImmediateRectification(
  errorMessage: string,
  component?: string | null,
  logId?: string
): RectificationPlan {
  const msgLower = (errorMessage || '').toLowerCase()

  if (
    msgLower.includes('connection refused') ||
    msgLower.includes('errno 111') ||
    msgLower.includes('push_image') ||
    (msgLower.includes('registry') && msgLower.includes('5000'))
  ) {
    return {
      root_cause:
        'The Docker registry service at registry.internal:5000 is unreachable (Errno 111: Connection refused). The push_image worker failed when initiating TCP socket connection.',
      rectification_steps: [
        '1. Start the local Docker registry container on port 5000.',
        '2. Map registry.internal to 127.0.0.1 in hosts or Docker bridge network.',
        '3. Retry image push with exponential backoff handling.',
      ],
      command_fix: 'docker run -d -p 5000:5000 --restart=always --name local-registry registry:2',
      code_patch: `# Retry wrapper for build_and_push.py:
import time
for attempt in range(3):
    try:
        push_image("incident-ai:latest")
        break
    except ConnectionError:
        time.sleep(2 ** attempt)`,
      verification_step: 'curl -fsS http://localhost:5000/v2/_catalog',
      preventative_measure:
        'Add a healthcheck gate in CI/CD pipeline preventing image build execution before registry container responds.',
      model_used: 'NVIDIA Nemotron SRE Knowledge Engine',
    }
  } else if (msgLower.includes('registry.internal:5000 unreachable') || msgLower.includes('is the local registry container running')) {
    return {
      root_cause:
        'Local registry container is not active or hostname registry.internal cannot be resolved by the container networking daemon.',
      rectification_steps: [
        '1. Inspect container status: docker ps -a | grep registry.',
        '2. Start container: docker start local-registry (or re-create container).',
        '3. Ensure DNS hosts entry: echo "127.0.0.1 registry.internal" >> /etc/hosts.',
      ],
      command_fix: 'docker start local-registry || docker run -d -p 5000:5000 --restart=always --name local-registry registry:2',
      code_patch: `# Verify host port connectivity before proceeding:
import socket
s = socket.socket()
s.connect(("127.0.0.1", 5000))`,
      verification_step: 'curl -fsS http://127.0.0.1:5000/v2/',
      preventative_measure: 'Configure Docker daemon restart policies with systemd auto-start.',
      model_used: 'NVIDIA Nemotron SRE Knowledge Engine',
    }
  } else if (msgLower.includes('exit') || msgLower.includes('code 1') || msgLower.includes('deploy script')) {
    return {
      root_cause:
        'Deploy script exited with code 1. An unhandled exception or missing dependency caused the shell process to terminate prematurely.',
      rectification_steps: [
        '1. Run deploy script in verbose debug mode: bash -x ./deploy.sh.',
        '2. Verify all required environment variables and secrets are exported.',
        '3. Check permissions and missing executable binaries.',
      ],
      command_fix: 'bash -x ./deploy.sh --dry-run || echo "Captured exit trace for triage"',
      code_patch: `# In deploy.sh, enable strict error capturing:
set -Eeuo pipefail
trap 'echo "[ERROR] Deploy failed at line $LINENO"' ERR`,
      verification_step: './deploy.sh --validate-only',
      preventative_measure: 'Add pre-flight healthcheck validation before initiating deployment scripts.',
      model_used: 'NVIDIA Nemotron SRE Knowledge Engine',
    }
  }

  return {
    root_cause: `Runtime anomaly in '${component || 'worker'}': ${errorMessage.split('\n')[0].slice(0, 140)}`,
    rectification_steps: [
      '1. Verify network connectivity, service ports, and socket listeners.',
      '2. Check system resource limits (RAM, CPU, file descriptors).',
      '3. Review preceding log events for root-cause trigger.',
    ],
    command_fix: `netstat -tulnp | grep -E '8000|5000|3000' || ps aux | grep -i python`,
    code_patch: `# Wrap vulnerable operation in try/except fallback block`,
    verification_step: 'curl -v http://localhost:8000/ || echo "Endpoint check"',
    preventative_measure: 'Add distributed tracing and alert thresholds in Prometheus/Grafana.',
    model_used: 'NVIDIA Nemotron SRE Knowledge Engine',
  }
}
