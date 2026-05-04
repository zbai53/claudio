const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Root element #app not found');
}

app.innerHTML = `
  <main class="container">
    <h1>Claudio</h1>
    <p class="tagline">Personal AI radio · in development</p>
    <p class="health">Backend status: <span id="health">checking...</span></p>
  </main>
`;

const healthEl = document.querySelector<HTMLSpanElement>('#health');
if (!healthEl) {
  throw new Error('Health element not found');
}

// 调 /api/health 验证 Vite proxy 转发到 server (3000) 工作正常
async function checkHealth(): Promise<void> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as { ok: boolean };
    healthEl!.textContent = data.ok ? '✓ connected' : '✗ unhealthy';
    healthEl!.style.color = data.ok ? '#4ade80' : '#f87171';
  } catch (err) {
    healthEl!.textContent = `✗ ${err instanceof Error ? err.message : 'unknown'}`;
    healthEl!.style.color = '#f87171';
  }
}

void checkHealth();