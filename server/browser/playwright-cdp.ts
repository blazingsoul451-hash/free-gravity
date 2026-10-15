/**
 * Free Gravity - Uncapped Browser-in-the-Loop Engine (Playwright + CDP Screencast)
 * 
 * OWASP ASI03: Ephemeral Isolated Browser Contexts
 * Real-time CDP Screencast Frame Streaming
 * Chronological Action Timeline & Execution Engine
 * Human Takeover Seamless Handoff (Headless <-> Headful for CAPTCHAs/MFA)
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { sanitizeUntrustedWebContent } from '../security/owasp-asi-guard.ts';

// ============================================================================
// Types & Contracts
// ============================================================================

export type BrowserActionType =
  | 'navigate'
  | 'click'
  | 'type'
  | 'scroll'
  | 'screenshot'
  | 'extractDom'
  | 'hover'
  | 'press'
  | 'wait';

export interface ScreencastMetadata {
  offsetTop: number;
  pageScaleFactor: number;
  deviceWidth: number;
  deviceHeight: number;
  scrollOffsetX: number;
  scrollOffsetY: number;
  timestamp?: number;
}

export interface ScreencastFrameData {
  frame: string; // base64 JPEG
  metadata: ScreencastMetadata;
  sessionId: number;
}

export interface TimelineAction {
  id: string;
  timestamp: number;
  type: BrowserActionType;
  target?: string | { x: number; y: number };
  params?: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  durationMs?: number;
  error?: string;
  result?: Record<string, unknown>;
}

export interface InteractiveElement {
  index: number;
  tagName: string;
  role?: string;
  text: string;
  selector: string;
  rect: { x: number; y: number; width: number; height: number };
  attributes: Record<string, string>;
}

export interface SanitizedDomResult {
  title: string;
  url: string;
  sanitizedHtml: string;
  textContent: string;
  interactiveElements: InteractiveElement[];
}

export interface BrowserEngineConfig {
  viewport?: { width: number; height: number };
  userAgent?: string;
  screencastQuality?: number;
  screencastFormat?: 'jpeg' | 'png';
  ephemeral?: boolean;
}

// ============================================================================
// Playwright CDP Browser Engine
// ============================================================================

export class PlaywrightCDPEngine extends EventEmitter {
  private browser: any = null;
  private context: any = null;
  private page: any = null;
  private cdpSession: any = null;

  // Ephemeral storage tracking
  private ephemeralDir: string | null = null;
  private isInitialized = false;
  private isStreaming = false;
  private screencastListenersCount = 0;

  // Human Takeover state
  private isHumanTakeoverActive = false;
  private headfulBrowser: any = null;
  private headfulPage: any = null;

  // Chronological action history
  private actionTimeline: TimelineAction[] = [];
  private maxTimelineSize = 200;

  private config: Required<BrowserEngineConfig>;

  constructor(config?: BrowserEngineConfig) {
    super();
    this.config = {
      viewport: config?.viewport || { width: 1280, height: 720 },
      userAgent:
        config?.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 FreeGravity/1.0',
      screencastQuality: config?.screencastQuality ?? 80,
      screencastFormat: config?.screencastFormat || 'jpeg',
      ephemeral: config?.ephemeral ?? true,
    };
  }

  /**
   * Lazily loads the Playwright module. Supports playwright or playwright-core.
   */
  private async loadPlaywright(): Promise<any> {
    try {
      // @ts-ignore dynamic import
      const pw = await import('playwright');
      return pw.default || pw;
    } catch {
      try {
        // @ts-ignore fallback dynamic import
        const pwCore = await import('playwright-core');
        return pwCore.default || pwCore;
      } catch (err) {
        throw new Error(
          'Playwright is not installed. Please ensure "playwright" or "playwright-core" is in dependencies.'
        );
      }
    }
  }

  /**
   * Initializes the browser with an ephemeral isolated profile directory (OWASP ASI03).
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized && this.page) {
      return;
    }

    const pw = await this.loadPlaywright();

    if (this.config.ephemeral) {
      const uniqueId = crypto.randomUUID();
      this.ephemeralDir = path.join(os.tmpdir(), `free-gravity-profile-${uniqueId}`);
      if (!fs.existsSync(this.ephemeralDir)) {
        fs.mkdirSync(this.ephemeralDir, { recursive: true });
      }
    }

    // Launch headless chromium with isolated profile
    this.browser = await pw.chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--no-default-browser-check',
        '--disable-infobars',
        `--window-size=${this.config.viewport.width},${this.config.viewport.height}`,
      ],
    });

    this.context = await this.browser.newContext({
      viewport: this.config.viewport,
      userAgent: this.config.userAgent,
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      ignoreHTTPSErrors: true,
    });

    this.page = await this.context.newPage();

    // Prevent webdriver detection flags
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    // Attach CDP Session
    this.cdpSession = await this.context.newCDPSession(this.page);
    this.setupCDPListeners();

    this.isInitialized = true;
    this.emit('initialized', { viewport: this.config.viewport });
  }

  /**
   * Sets up Chrome DevTools Protocol screencast frame listeners.
   */
  private setupCDPListeners(): void {
    if (!this.cdpSession) return;

    this.cdpSession.on('Page.screencastFrame', async (params: any) => {
      const { data, metadata, sessionId } = params;

      // Immediate frame acknowledgement is required by CDP to keep stream running
      try {
        await this.cdpSession.send('Page.screencastFrameAck', { sessionId });
      } catch (err) {
        // Session might have been closed or detached
      }

      const framePayload: ScreencastFrameData = {
        frame: data,
        metadata: {
          offsetTop: metadata.offsetTop || 0,
          pageScaleFactor: metadata.pageScaleFactor || 1,
          deviceWidth: metadata.deviceWidth || this.config.viewport.width,
          deviceHeight: metadata.deviceHeight || this.config.viewport.height,
          scrollOffsetX: metadata.scrollOffsetX || 0,
          scrollOffsetY: metadata.scrollOffsetY || 0,
          timestamp: metadata.timestamp,
        },
        sessionId,
      };

      this.emit('frame', framePayload);
    });
  }

  /**
   * Starts real-time CDP screencasting.
   */
  public async startScreencast(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.screencastListenersCount++;
    if (this.isStreaming) return;

    try {
      await this.cdpSession.send('Page.startScreencast', {
        format: this.config.screencastFormat,
        quality: this.config.screencastQuality,
        maxWidth: this.config.viewport.width,
        maxHeight: this.config.viewport.height,
        everyNthFrame: 1,
      });
      this.isStreaming = true;
      this.emit('screencast_started');
    } catch (err: any) {
      this.emit('error', new Error(`Failed to start screencast: ${err.message}`));
    }
  }

  /**
   * Stops CDP screencasting when no clients are listening.
   */
  public async stopScreencast(): Promise<void> {
    this.screencastListenersCount = Math.max(0, this.screencastListenersCount - 1);

    if (this.screencastListenersCount === 0 && this.isStreaming && this.cdpSession) {
      try {
        await this.cdpSession.send('Page.stopScreencast');
        this.isStreaming = false;
        this.emit('screencast_stopped');
      } catch {
        // Session already terminated
      }
    }
  }

  // ============================================================================
  // Browser Actions & Execution Engine
  // ============================================================================

  /**
   * Navigates the browser to the specified URL.
   */
  public async navigate(
    url: string,
    options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }
  ): Promise<TimelineAction> {
    return this.recordAction('navigate', url, options, async () => {
      let targetUrl = url;
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      await this.page.goto(targetUrl, {
        waitUntil: options?.waitUntil || 'domcontentloaded',
        timeout: options?.timeout || 30000,
      });
      return { url: this.page.url(), title: await this.page.title() };
    });
  }

  /**
   * Performs click on a CSS selector or viewport coordinate {x, y}.
   */
  public async click(
    selectorOrCoords: string | { x: number; y: number },
    options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number }
  ): Promise<TimelineAction> {
    return this.recordAction('click', selectorOrCoords, options, async () => {
      if (typeof selectorOrCoords === 'string') {
        await this.page.click(selectorOrCoords, {
          button: options?.button || 'left',
          clickCount: options?.clickCount || 1,
          timeout: 10000,
        });
      } else {
        await this.page.mouse.click(selectorOrCoords.x, selectorOrCoords.y, {
          button: options?.button || 'left',
          clickCount: options?.clickCount || 1,
        });
      }
      return { clicked: selectorOrCoords };
    });
  }

  /**
   * Types text into a selector with optional typing delay and clear flag.
   */
  public async type(
    selector: string,
    text: string,
    options?: { delay?: number; clear?: boolean }
  ): Promise<TimelineAction> {
    return this.recordAction('type', selector, { textLength: text.length, ...options }, async () => {
      if (options?.clear) {
        await this.page.fill(selector, '');
      }
      await this.page.type(selector, text, {
        delay: options?.delay ?? 30,
        timeout: 10000,
      });
      return { selector, length: text.length };
    });
  }

  /**
   * Scrolls the page by delta coordinates or to an absolute coordinate.
   */
  public async scroll(
    options: { deltaX?: number; deltaY?: number } | { x: number; y: number }
  ): Promise<TimelineAction> {
    return this.recordAction('scroll', undefined, options, async () => {
      if ('deltaX' in options || 'deltaY' in options) {
        await this.page.mouse.wheel(options.deltaX || 0, options.deltaY || 0);
      } else {
        await this.page.evaluate(({ x, y }: { x: number; y: number }) => {
          window.scrollTo(x, y);
        }, options);
      }
      return options;
    });
  }

  /**
   * Captures a high-resolution screenshot as base64 string.
   */
  public async screenshot(options?: {
    fullPage?: boolean;
    type?: 'jpeg' | 'png';
  }): Promise<{ base64: string; mimeType: string }> {
    if (!this.page) throw new Error('Browser is not initialized.');
    const format = options?.type || 'jpeg';
    const buffer = await this.page.screenshot({
      fullPage: options?.fullPage ?? false,
      type: format,
      quality: format === 'jpeg' ? 85 : undefined,
    });
    return {
      base64: buffer.toString('base64'),
      mimeType: `image/${format}`,
    };
  }

  /**
   * Extracts clean, sanitized DOM and structured interactive elements (OWASP ASI01 isolation).
   */
  public async extractSanitizedDom(): Promise<SanitizedDomResult> {
    if (!this.page) throw new Error('Browser is not initialized.');

    const title = await this.page.title();
    const url = this.page.url();

    // Extract interactive elements tree and inner text from page execution context
    const extractedData = await this.page.evaluate(() => {
      const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', '[role="button"]'];
      const elements = Array.from(document.querySelectorAll(interactiveTags.join(',')));

      const interactiveList: Array<{
        index: number;
        tagName: string;
        role: string;
        text: string;
        selector: string;
        rect: { x: number; y: number; width: number; height: number };
        attributes: Record<string, string>;
      }> = [];

      let idx = 0;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        // Skip invisible or off-screen elements
        if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') {
          continue;
        }

        const attrs: Record<string, string> = {};
        for (const attr of el.attributes) {
          if (['id', 'name', 'type', 'placeholder', 'href', 'aria-label', 'value'].includes(attr.name)) {
            attrs[attr.name] = attr.value;
          }
        }

        let selector = el.tagName.toLowerCase();
        if (el.id) selector += `#${el.id}`;
        else if (attrs.name) selector += `[name="${attrs.name}"]`;

        interactiveList.push({
          index: idx++,
          tagName: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || '',
          text: (el.textContent || '').trim().slice(0, 100),
          selector,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          attributes: attrs,
        });

        if (interactiveList.length >= 100) break; // Limit payload size
      }

      return {
        rawHtml: document.body ? document.body.innerHTML : '',
        textContent: (document.body ? document.body.innerText : '').slice(0, 50000),
        interactiveList,
      };
    });

    // Run OWASP ASI01 Indirect Prompt Injection Sanitizer on the extracted HTML
    const sanitizedHtml = sanitizeUntrustedWebContent(extractedData.rawHtml);

    return {
      title,
      url,
      sanitizedHtml,
      textContent: extractedData.textContent,
      interactiveElements: extractedData.interactiveList,
    };
  }

  // ============================================================================
  // Human Takeover Mode (ASI03 Cloudflare / CAPTCHA / MFA Resolver)
  // ============================================================================

  /**
   * Triggers Human Takeover:
   * Pauses autonomous agent actions, captures current cookies & storage,
   * and opens a visible headful Chromium window so the human user can solve CAPTCHAs/MFA.
   */
  public async triggerHumanTakeover(): Promise<{ active: boolean; currentUrl: string }> {
    if (!this.isInitialized || !this.page) {
      await this.initialize();
    }

    if (this.isHumanTakeoverActive) {
      return { active: true, currentUrl: this.page.url() };
    }

    this.isHumanTakeoverActive = true;
    const currentUrl = this.page.url();
    const cookies = await this.context.cookies();

    const pw = await this.loadPlaywright();

    // Launch visible headful browser with user's cookies
    this.headfulBrowser = await pw.chromium.launch({
      headless: false,
      args: ['--start-maximized', '--no-default-browser-check'],
    });

    const headfulContext = await this.headfulBrowser.newContext({
      viewport: null, // use actual window size
      userAgent: this.config.userAgent,
    });

    await headfulContext.addCookies(cookies);
    this.headfulPage = await headfulContext.newPage();

    if (currentUrl && currentUrl !== 'about:blank') {
      await this.headfulPage.goto(currentUrl, { waitUntil: 'domcontentloaded' });
    }

    // Monitor if the user manually closes the window
    this.headfulBrowser.on('disconnected', () => {
      if (this.isHumanTakeoverActive) {
        this.resumeAgentControl().catch(() => {});
      }
    });

    this.emit('human_takeover_started', { url: currentUrl });
    return { active: true, currentUrl };
  }

  /**
   * Resumes Agent Control:
   * Captures updated cookies/auth state from the headful window back into the headless context,
   * closes headful window, and re-engages autonomous agent execution.
   */
  public async resumeAgentControl(): Promise<{ active: boolean; currentUrl: string }> {
    if (!this.isHumanTakeoverActive) {
      return { active: false, currentUrl: this.page ? this.page.url() : '' };
    }

    let updatedUrl = this.page.url();

    if (this.headfulBrowser && this.headfulPage) {
      try {
        updatedUrl = this.headfulPage.url();
        const updatedCookies = await this.headfulBrowser.contexts()[0]?.cookies();

        if (updatedCookies && updatedCookies.length > 0 && this.context) {
          await this.context.addCookies(updatedCookies);
        }

        await this.headfulBrowser.close();
      } catch (err) {
        // Headful browser might already be closed by user
      } finally {
        this.headfulBrowser = null;
        this.headfulPage = null;
      }
    }

    this.isHumanTakeoverActive = false;

    // Refresh headless page with solved state
    if (this.page && updatedUrl && updatedUrl !== 'about:blank') {
      try {
        await this.page.goto(updatedUrl, { waitUntil: 'domcontentloaded' });
      } catch {
        // Ignore navigation error on resume
      }
    }

    this.emit('human_takeover_resumed', { url: updatedUrl });
    return { active: false, currentUrl: updatedUrl };
  }

  public isTakeoverActive(): boolean {
    return this.isHumanTakeoverActive;
  }

  // ============================================================================
  // Action Timeline Tracking
  // ============================================================================

  private async recordAction(
    type: BrowserActionType,
    target: any,
    params: any,
    fn: () => Promise<any>
  ): Promise<TimelineAction> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isHumanTakeoverActive) {
      throw new Error('Action rejected: Human Takeover is currently active.');
    }

    const actionId = `action-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const startTime = Date.now();

    const actionRecord: TimelineAction = {
      id: actionId,
      timestamp: startTime,
      type,
      target,
      params,
      status: 'pending',
    };

    this.actionTimeline.push(actionRecord);
    if (this.actionTimeline.length > this.maxTimelineSize) {
      this.actionTimeline.shift();
    }

    this.emit('timeline_update', actionRecord);

    try {
      const result = await fn();
      actionRecord.status = 'success';
      actionRecord.durationMs = Date.now() - startTime;
      actionRecord.result = result;
      this.emit('timeline_update', actionRecord);
      return actionRecord;
    } catch (err: any) {
      actionRecord.status = 'failed';
      actionRecord.durationMs = Date.now() - startTime;
      actionRecord.error = err.message;
      this.emit('timeline_update', actionRecord);
      throw err;
    }
  }

  public getTimeline(): TimelineAction[] {
    return [...this.actionTimeline];
  }

  public getPageUrl(): string {
    return this.page ? this.page.url() : '';
  }

  // ============================================================================
  // Teardown & Ephemeral Cleanup
  // ============================================================================

  public async close(): Promise<void> {
    try {
      if (this.isStreaming && this.cdpSession) {
        await this.cdpSession.send('Page.stopScreencast').catch(() => {});
        this.isStreaming = false;
      }

      if (this.headfulBrowser) {
        await this.headfulBrowser.close().catch(() => {});
        this.headfulBrowser = null;
      }

      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }

      // Cleanup ephemeral isolated profile directory (OWASP ASI03)
      if (this.ephemeralDir && fs.existsSync(this.ephemeralDir)) {
        try {
          fs.rmSync(this.ephemeralDir, { recursive: true, force: true });
        } catch {
          // Ignore temp cleanup errors on Windows locks
        }
        this.ephemeralDir = null;
      }
    } finally {
      this.isInitialized = false;
      this.isHumanTakeoverActive = false;
      this.emit('closed');
    }
  }
}

export const browserEngine = new PlaywrightCDPEngine();
