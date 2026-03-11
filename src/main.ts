import './style.css';

import tgpu, { common, d, std } from 'typegpu';

const RECOMMENDED_COMMAND = `env DRI_PRIME=pci-0000_00_02_0 google-chrome-stable \\
  --ozone-platform=wayland \\
  --render-node-override=/dev/dri/renderD128 \\
  --enable-features=Vulkan,UseSkiaRenderer \\
  --enable-unsafe-webgpu`;

const uniformSchema = d.struct({
  resolution: d.vec2f,
  pointer: d.vec2f,
  time: d.f32,
  delta: d.f32,
  intensity: d.f32,
  aspect: d.f32,
});

type UniformState = d.Infer<typeof uniformSchema>;
type Diagnostics = {
  browser: string;
  hasNavigatorGpu: boolean;
  adapterAvailable: boolean | null;
  lastAttempt: string;
  error: string;
};

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root not found');
const appRoot = app;

appRoot.innerHTML = `
  <div class="shell">
    <canvas class="accent-canvas"></canvas>
    <div class="shell-overlay"></div>
    <main class="system-page">
      <header class="hero panel">
        <div class="hero-copy">
          <p class="eyebrow">TypeGPU Design System</p>
          <h1>Northstar UI</h1>
          <p class="hero-lead">
            A full-stack component surface for dashboards, product UI, and editorial tools.
            Built as a practical design system with TypeGPU driving the ambient interaction layer.
          </p>
          <div class="hero-actions">
            <button class="button button--primary">Get Started</button>
            <button class="button button--ghost js-open-modal">Preview Modal</button>
            <button class="button button--secondary js-spawn-toast">Spawn Toast</button>
          </div>
        </div>
        <div class="hero-aside">
          <div class="mini-stat-grid">
            <article class="mini-stat">
              <span>Components</span>
              <strong>28</strong>
              <em>core primitives</em>
            </article>
            <article class="mini-stat">
              <span>Patterns</span>
              <strong>11</strong>
              <em>app-ready layouts</em>
            </article>
            <article class="mini-stat">
              <span>Accent</span>
              <strong>TypeGPU</strong>
              <em>ambient backdrop</em>
            </article>
            <article class="mini-stat">
              <span>Motion</span>
              <strong>Reduced-safe</strong>
              <em>respect system prefs</em>
            </article>
          </div>
        </div>
      </header>

      <section class="section-grid">
        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Tokens</p>
              <h2>Color, radius, and type direction</h2>
            </div>
            <span class="section-note">System primitives</span>
          </div>
          <div class="token-grid">
            <div class="token-card">
              <span class="token-swatch token-swatch--ink"></span>
              <strong>Ink 950</strong>
              <code>#071019</code>
            </div>
            <div class="token-card">
              <span class="token-swatch token-swatch--panel"></span>
              <strong>Panel Frost</strong>
              <code>rgba(5,10,16,.56)</code>
            </div>
            <div class="token-card">
              <span class="token-swatch token-swatch--brand"></span>
              <strong>Brand Ember</strong>
              <code>#ff8c57</code>
            </div>
            <div class="token-card">
              <span class="token-swatch token-swatch--accent"></span>
              <strong>Accent Cyan</strong>
              <code>#5fd0ff</code>
            </div>
          </div>
          <div class="type-card">
            <div>
              <span class="type-label">Display</span>
              <h3>Space Grotesk</h3>
              <p>Used for hero titles, section headers, and high-signal numeric cards.</p>
            </div>
            <div>
              <span class="type-label">Body</span>
              <h3>IBM Plex Sans</h3>
              <p>Used for controls, forms, and dense product UI copy.</p>
            </div>
          </div>
        </article>

        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Actions</p>
              <h2>Buttons, chips, and segmented controls</h2>
            </div>
            <span class="section-note">Core interactions</span>
          </div>
          <div class="button-row">
            <button class="button button--primary">Primary</button>
            <button class="button button--secondary">Secondary</button>
            <button class="button button--ghost">Ghost</button>
            <button class="button button--danger">Danger</button>
          </div>
          <div class="chip-row">
            <span class="badge badge--success">Stable</span>
            <span class="badge badge--warning">Beta</span>
            <span class="badge badge--neutral">Internal</span>
            <span class="badge badge--info">Realtime</span>
          </div>
          <div class="segmented">
            <button class="segmented__item is-active" type="button">Overview</button>
            <button class="segmented__item" type="button">Reports</button>
            <button class="segmented__item" type="button">Activity</button>
          </div>
          <div class="icon-button-row">
            <button class="icon-button" type="button">&#128269;</button>
            <button class="icon-button" type="button">&#9881;</button>
            <button class="icon-button" type="button">&#128276;</button>
            <button class="icon-button" type="button">&#11044;</button>
          </div>
        </article>
      </section>

      <section class="section-grid section-grid--forms">
        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Forms</p>
              <h2>Inputs for dense product UI</h2>
            </div>
            <span class="section-note">Entry patterns</span>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>Workspace name</span>
              <input class="input" value="Northstar" />
            </label>
            <label class="field">
              <span>Owner</span>
              <select class="input">
                <option>Design Ops</option>
                <option>Growth</option>
                <option>Platform</option>
              </select>
            </label>
            <label class="field field--wide">
              <span>Status note</span>
              <textarea class="input textarea">System tokens are locked. Shipping feedback components next.</textarea>
            </label>
          </div>
          <div class="toggle-row">
            <label class="switch">
              <input type="checkbox" checked />
              <span class="switch__track"></span>
              <span>Enable realtime sync</span>
            </label>
            <label class="switch">
              <input type="checkbox" />
              <span class="switch__track"></span>
              <span>Require approval mode</span>
            </label>
          </div>
        </article>

        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Feedback</p>
              <h2>Alerts and inline states</h2>
            </div>
            <span class="section-note">Communicate status</span>
          </div>
          <div class="alert-stack">
            <div class="alert alert--success">
              <strong>Deploy complete</strong>
              <span>Four regions updated in 22 seconds.</span>
            </div>
            <div class="alert alert--warning">
              <strong>Review required</strong>
              <span>Billing thresholds changed for enterprise seats.</span>
            </div>
            <div class="alert alert--neutral">
              <strong>Draft mode</strong>
              <span>No customer-facing changes will publish until approval.</span>
            </div>
          </div>
        </article>
      </section>

      <section class="section-grid section-grid--metrics">
        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Dashboards</p>
              <h2>Metric cards and table scaffolding</h2>
            </div>
            <span class="section-note">Operations UI</span>
          </div>
          <div class="metric-grid">
            <div class="metric-card">
              <span>MRR</span>
              <strong>$184k</strong>
              <em>+12.4% MoM</em>
            </div>
            <div class="metric-card">
              <span>Churn risk</span>
              <strong>3.8%</strong>
              <em>down 0.6 pts</em>
            </div>
            <div class="metric-card">
              <span>Weekly active</span>
              <strong>42,918</strong>
              <em>92% retention</em>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr><th>Team</th><th>Status</th><th>Owner</th><th>Updated</th></tr>
            </thead>
            <tbody>
              <tr><td>Growth experiments</td><td><span class="badge badge--success">Healthy</span></td><td>Mika</td><td>2m ago</td></tr>
              <tr><td>Partner API rollout</td><td><span class="badge badge--warning">Watching</span></td><td>Rae</td><td>14m ago</td></tr>
              <tr><td>Billing migration</td><td><span class="badge badge--neutral">Queued</span></td><td>Jon</td><td>1h ago</td></tr>
            </tbody>
          </table>
        </article>

        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Navigation</p>
              <h2>Sidebar and command surface</h2>
            </div>
            <span class="section-note">App chrome</span>
          </div>
          <div class="shell-preview">
            <aside class="shell-sidebar">
              <div class="shell-sidebar__brand">Northstar</div>
              <button class="shell-sidebar__item is-active" type="button">Overview</button>
              <button class="shell-sidebar__item" type="button">Revenue</button>
              <button class="shell-sidebar__item" type="button">Customers</button>
              <button class="shell-sidebar__item" type="button">Settings</button>
            </aside>
            <div class="command-surface">
              <div class="command-surface__top">
                <span>Quick actions</span>
                <kbd>⌘K</kbd>
              </div>
              <div class="command-list">
                <button class="command-item is-active" type="button">Create report</button>
                <button class="command-item" type="button">Invite teammate</button>
                <button class="command-item" type="button">Open changelog</button>
                <button class="command-item" type="button">View API tokens</button>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="section-grid section-grid--patterns">
        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Patterns</p>
              <h2>Cards, pricing, and empty states</h2>
            </div>
            <span class="section-note">Marketing + product</span>
          </div>
          <div class="card-stack">
            <article class="feature-card">
              <span class="badge badge--info">New</span>
              <h3>Release notes composer</h3>
              <p>Structured publishing workflow for product updates, owners, and approvals.</p>
              <button class="text-link" type="button">Open pattern</button>
            </article>
            <article class="feature-card">
              <span class="badge badge--neutral">System</span>
              <h3>Pricing module</h3>
              <p>Composable pricing cards with feature lists, emphasis states, and comparisons.</p>
              <div class="pricing-card">
                <div>
                  <strong>Scale</strong>
                  <span>$149 / seat</span>
                </div>
                <ul>
                  <li>Custom roles</li>
                  <li>Approvals</li>
                  <li>Audit logs</li>
                </ul>
              </div>
            </article>
            <article class="feature-card feature-card--empty">
              <span class="badge badge--warning">Empty state</span>
              <h3>No segments created yet</h3>
              <p>Use empty states to explain the next action, not just the absence of data.</p>
              <button class="button button--primary">Create first segment</button>
            </article>
          </div>
        </article>

        <article class="panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">Live demos</p>
              <h2>Tabs, modal, and toast interactions</h2>
            </div>
            <span class="section-note">Interactive layer</span>
          </div>
          <div class="tabs-demo">
            <div class="tabs js-tabs">
              <button class="tabs__item is-active" data-tab="summary" type="button">Summary</button>
              <button class="tabs__item" data-tab="activity" type="button">Activity</button>
              <button class="tabs__item" data-tab="access" type="button">Access</button>
            </div>
            <div class="tab-panel js-tab-panel">
              <strong>Summary</strong>
              <p>Northstar favors dense product surfaces with clear visual hierarchy and restrained motion.</p>
            </div>
          </div>
          <div class="interactive-row">
            <button class="button button--secondary js-open-modal" type="button">Open modal</button>
            <button class="button button--ghost js-spawn-toast" type="button">Create toast</button>
          </div>
          <div class="toast-rail js-toast-rail"></div>
        </article>
      </section>
    </main>
    <div class="modal-backdrop js-modal-backdrop" hidden>
      <div class="modal-card">
        <div class="modal-card__head">
          <div>
            <p class="eyebrow">Modal</p>
            <h3>Review launch checklist</h3>
          </div>
          <button class="icon-button js-close-modal" type="button">&#10005;</button>
        </div>
        <p class="modal-card__copy">
          This modal uses the same surface tokens as the rest of the system: soft frost panel,
          strong heading hierarchy, and minimal motion.
        </p>
        <div class="modal-card__actions">
          <button class="button button--ghost js-close-modal" type="button">Cancel</button>
          <button class="button button--primary" type="button">Approve launch</button>
        </div>
      </div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('.accent-canvas');
const accentStatusEl = document.querySelector<HTMLElement>('.js-accent-status');
const toastRail = document.querySelector<HTMLElement>('.js-toast-rail');
const tabPanel = document.querySelector<HTMLElement>('.js-tab-panel');
const modalBackdrop = document.querySelector<HTMLElement>('.js-modal-backdrop');
const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.tabs__item'));
const openModalButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.js-open-modal'));
const closeModalButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.js-close-modal'));
const spawnToastButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.js-spawn-toast'));

if (!canvas || !accentStatusEl || !toastRail || !tabPanel || !modalBackdrop) {
  throw new Error('Required DOM elements not found');
}

const sceneCanvas = canvas;
const accentStatus = accentStatusEl;
const toastRailEl = toastRail;
const tabPanelEl = tabPanel;
const modalBackdropEl = modalBackdrop;
const pointer = { x: 0, y: 0, active: false };
let reduceMotionQuery: MediaQueryList | null = null;
let toastCount = 0;

const tabContent: Record<string, { title: string; body: string }> = {
  summary: {
    title: 'Summary',
    body: 'Northstar favors dense product surfaces with clear visual hierarchy and restrained motion.',
  },
  activity: {
    title: 'Activity',
    body: 'Recent interaction states use transforms and opacity, avoiding layout-shifting animation for common actions.',
  },
  access: {
    title: 'Access',
    body: 'Permissions surfaces use badges, tabular roles, and status cues that stay legible under high density.',
  },
};

window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
  pointer.active = true;
});
window.addEventListener('pointerleave', () => {
  pointer.active = false;
});

function detectBrowser(): string {
  const { userAgent } = navigator;
  if (userAgent.includes('OPR/')) return 'Opera';
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chromium')) return 'Chromium';
  if (userAgent.includes('Chrome/')) return 'Chrome';
  if (userAgent.includes('Firefox/')) return 'Firefox';
  return 'Unknown browser';
}

function renderAccentFallback(details: Diagnostics) {
  accentStatus.innerHTML = `
    <strong>TypeGPU accent unavailable</strong>
    <span>${details.error}</span>
    <code>${RECOMMENDED_COMMAND}</code>
  `;
}

function renderAccentReady() {
  accentStatus.innerHTML = `
    <strong>TypeGPU accent active</strong>
    <span>The design system runs without WebGPU, but the ambient field is live in this session.</span>
  `;
}

function setTab(tab: string) {
  tabButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tab === tab);
  });
  const content = tabContent[tab];
  tabPanelEl.innerHTML = `<strong>${content.title}</strong><p>${content.body}</p>`;
}

function setModal(open: boolean) {
  modalBackdropEl.hidden = !open;
}

function spawnToast() {
  toastCount += 1;
  const toast = document.createElement('article');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="badge badge--info">Live</span>
    <strong>Component saved</strong>
    <p>Northstar system draft ${toastCount} synced to the workspace.</p>
  `;
  toastRailEl.prepend(toast);
  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    window.setTimeout(() => toast.remove(), 220);
  }, 2800);
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!button.dataset.tab) return;
    setTab(button.dataset.tab);
  });
});

openModalButtons.forEach((button) => button.addEventListener('click', () => setModal(true)));
closeModalButtons.forEach((button) => button.addEventListener('click', () => setModal(false)));
modalBackdropEl.addEventListener('click', (event) => {
  if (event.target === modalBackdropEl) setModal(false);
});
spawnToastButtons.forEach((button) => button.addEventListener('click', spawnToast));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setModal(false);
});

setTab('summary');

async function initAccentLayer() {
  const browser = detectBrowser();
  const lastAttempt = new Date().toLocaleTimeString();

  if (!navigator.gpu) {
    renderAccentFallback({
      browser,
      hasNavigatorGpu: false,
      adapterAvailable: null,
      lastAttempt,
      error: 'navigator.gpu is missing in this browser session.',
    });
    return;
  }

  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'low-power' });
  if (!adapter) {
    renderAccentFallback({
      browser,
      hasNavigatorGpu: true,
      adapterAvailable: false,
      lastAttempt,
      error: 'requestAdapter() returned null. Launch Chrome on the Intel/Vulkan path for the TypeGPU accent.',
    });
    return;
  }

  const device = await adapter.requestDevice();
  const root = tgpu.initFromDevice({ device });
  const context = root.configureContext({
    canvas: sceneCanvas,
    alphaMode: 'premultiplied',
  });

  const uniforms = root.createUniform(uniformSchema, {
    resolution: d.vec2f(1, 1),
    pointer: d.vec2f(0, 0),
    time: 0,
    delta: 0,
    intensity: 0,
    aspect: 1,
  });

  const layout = tgpu.bindGroupLayout({
    uniforms: { uniform: uniformSchema },
  });

  const bindGroup = root.createBindGroup(layout, {
    uniforms: uniforms.buffer,
  });

  const pipeline = root.createRenderPipeline({
    vertex: common.fullScreenTriangle,
    fragment: ({ uv }) => {
      'use gpu';

      const resolution = layout.$.uniforms.resolution;
      const pointerPos = layout.$.uniforms.pointer;
      const time = layout.$.uniforms.time;
      const pointerStrength = layout.$.uniforms.intensity;

      let p = uv.mul(2).sub(d.vec2f(1, 1));
      p = d.vec2f(p.x * (resolution.x / resolution.y), p.y);

      const pointerOffset = pointerPos.mul(pointerStrength * 0.42);
      const flare = std.exp(-std.length(p.sub(pointerOffset)) * 2.8);
      const rings = std.sin(std.length(p.add(pointerOffset.mul(0.6))) * 14 - time * 1.9) * 0.5 + 0.5;
      const mesh =
        (1 - std.smoothstep(0.02, 0.055, std.abs(std.fract(p.x * 6) - 0.5))) * 0.08 +
        (1 - std.smoothstep(0.02, 0.055, std.abs(std.fract(p.y * 6) - 0.5))) * 0.08;
      const drift = std.sin(p.x * 10 + time * 0.7) * std.cos(p.y * 8 - time * 0.5) * 0.5 + 0.5;

      const base = d.vec3f(0.02, 0.03, 0.05);
      const cyan = d.vec3f(0.12, 0.68, 1.0).mul(rings * 0.18 + mesh);
      const ember = d.vec3f(1.0, 0.56, 0.22).mul(flare * 0.45 + drift * 0.08);
      const haze = d.vec3f(0.16, 0.24, 0.4).mul(std.exp(-std.length(p) * 0.9) * 0.24);
      const vignette = 1 - std.smoothstep(0.2, 1.85, std.length(p));
      const color = base.add(cyan).add(ember).add(haze);

      return d.vec4f(color.x * vignette, color.y * vignette, color.z * vignette, 1);
    },
  });

  renderAccentReady();

  let previousTime = performance.now();
  reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(window.innerWidth * dpr));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr));
    if (sceneCanvas.width !== width || sceneCanvas.height !== height) {
      sceneCanvas.width = width;
      sceneCanvas.height = height;
    }
  };

  resize();
  window.addEventListener('resize', resize);

  const frame = (now: number) => {
    resize();
    const delta = Math.min((now - previousTime) / 1000, 0.033);
    previousTime = now;

    const uniformState: UniformState = {
      resolution: d.vec2f(sceneCanvas.width, sceneCanvas.height),
      pointer: d.vec2f(pointer.x, pointer.y),
      time: reduceMotionQuery?.matches ? 0 : now / 1000,
      delta,
      intensity: pointer.active ? 1 : 0,
      aspect: sceneCanvas.width / sceneCanvas.height,
    };

    uniforms.write(uniformState);
    pipeline
      .with(bindGroup)
      .withColorAttachment({
        view: context,
        clearValue: { r: 0.01, g: 0.015, b: 0.025, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      })
      .draw(3);

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

initAccentLayer().catch((error: unknown) => {
  console.error(error);
  renderAccentFallback({
    browser: detectBrowser(),
    hasNavigatorGpu: Boolean(navigator.gpu),
    adapterAvailable: null,
    lastAttempt: new Date().toLocaleTimeString(),
    error: error instanceof Error ? error.message : 'Unknown error while starting the accent layer.',
  });
});
