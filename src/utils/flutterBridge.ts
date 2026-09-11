/**
 * FlutterBridge - Modular & Reusable Game <-> Flutter Communication Layer
 * 
 * Works across Flutter WebView (webview_flutter), flutter_inappwebview,
 * web iframe embedding (window.parent.postMessage), and desktop browser debug modes.
 */

export interface BridgeInitConfig {
  gameId?: string;
  gameTitle?: string;
  debug?: boolean;
}

export interface BridgePayload {
  event: string;
  gameId: string;
  gameTitle: string;
  timeStamp: number;
  score: number;
  [key: string]: unknown;
}

export interface BridgeHistoryItem {
  direction: 'INCOMING' | 'OUTGOING';
  command?: string;
  event?: string;
  data?: unknown;
  payload?: BridgePayload;
  timestamp?: number;
  sentVia?: string[];
}

export type CommandCallback = (data: unknown) => void;

declare global {
  interface Window {
    FlutterBridge?: {
      postMessage: (message: string) => void;
    };
    flutter_inappwebview?: {
      callHandler: (handlerName: string, ...args: unknown[]) => unknown;
    };
    onFlutterCommand?: (command: string, data?: unknown) => void;
    flutterBridge?: FlutterBridgeService;
  }
}

export class FlutterBridgeService {
  private gameId: string;
  private gameTitle: string;
  public debug: boolean;
  private listeners: Map<string, Set<CommandCallback>>;
  private messageHistory: BridgeHistoryItem[];
  private maxHistoryLength: number;

  constructor() {
    this.gameId = 'stc_grade5_shooter';
    this.gameTitle = 'CANNON BALL';
    // Only log to console if debug=true or ?debug_bridge=true in URL
    this.debug = false;
    this.listeners = new Map();
    this.messageHistory = [];
    this.maxHistoryLength = 30;

    this._setupWindowListeners();
  }

  /**
   * Configure global game identity & debug options
   */
  init({ gameId, gameTitle, debug = false }: BridgeInitConfig = {}): void {
    if (gameId) this.gameId = gameId;
    if (gameTitle) this.gameTitle = gameTitle;
    this.debug = Boolean(debug);

    this.log(`[FlutterBridge] Initialized for game: "${this.gameTitle}" (${this.gameId})`);
  }

  /**
   * Log messages if debug mode is active
   */
  log(...args: unknown[]): void {
    if (this.debug) {
      console.log(...args);
    }
  }

  /**
   * Internal listener for incoming messages from Flutter or postMessage
   */
  private _setupWindowListeners(): void {
    if (typeof window === 'undefined') return;

    // 1. Listen for standard window.postMessage (if Flutter or parent iframe posts message to JS)
    window.addEventListener('message', (event: MessageEvent) => {
      try {
        let payload = event.data;
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch {
            // Not JSON, ignore
            return;
          }
        }
        if (payload && (payload.command || payload.action || payload.type)) {
          const cmd = payload.command || payload.action || payload.type;
          this._dispatchCommand(cmd, payload.data || payload);
        }
      } catch (err) {
        console.warn('[FlutterBridge] Error handling message event', err);
      }
    });

    // 2. Global explicit Flutter receiver function on window for direct JS evaluation
    // Flutter can call: webViewController.runJavaScript('window.onFlutterCommand("PAUSE", {})')
    window.onFlutterCommand = (command: string, data: unknown = {}) => {
      this._dispatchCommand(command, data);
    };
  }

  /**
   * Dispatch an incoming command to registered listeners
   */
  private _dispatchCommand(command: string, data: unknown): void {
    const cmdNormalized = String(command).toUpperCase();
    this.log(`[FlutterBridge] 📥 Received command: "${cmdNormalized}"`, data);

    this._recordHistory({
      direction: 'INCOMING',
      command: cmdNormalized,
      data,
      timestamp: Date.now(),
    });

    const callbacks = this.listeners.get(cmdNormalized);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`[FlutterBridge] Error in listener for "${cmdNormalized}"`, e);
        }
      });
    }
  }

  /**
   * Register a listener for a Flutter command (e.g. 'PAUSE', 'RESUME', 'RESTART', 'MUTE')
   */
  on(command: string, callback: CommandCallback): () => void {
    const cmd = String(command).toUpperCase();
    if (!this.listeners.has(cmd)) {
      this.listeners.set(cmd, new Set());
    }
    this.listeners.get(cmd)!.add(callback);
    return () => this.off(command, callback);
  }

  /**
   * Unregister a listener
   */
  off(command: string, callback: CommandCallback): void {
    const cmd = String(command).toUpperCase();
    const callbacks = this.listeners.get(cmd);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Core dispatch method to send message to Flutter
   * Schema: { event, gameId, gameTitle, timeStamp, score }
   */
  send(eventName: string, scoreOrData: number | { score?: number; [key: string]: unknown } = 0): BridgePayload {
    const score =
      typeof scoreOrData === 'number'
        ? scoreOrData
        : typeof scoreOrData === 'object' && scoreOrData !== null && 'score' in scoreOrData
          ? Number(scoreOrData.score) || 0
          : 0;

    const payload: BridgePayload = {
      event: eventName,
      gameId: this.gameId,
      gameTitle: this.gameTitle,
      timeStamp: Date.now(),
      score: score,
    };

    const jsonString = JSON.stringify(payload);
    const sentVia: string[] = [];

    if (typeof window !== 'undefined') {
      // 1. Check window.FlutterBridge (JavascriptChannel in Flutter webview_flutter)
      if (window.FlutterBridge && typeof window.FlutterBridge.postMessage === 'function') {
        try {
          window.FlutterBridge.postMessage(jsonString);
          sentVia.push('window.FlutterBridge');
        } catch (err) {
          console.error('[FlutterBridge] Error posting to window.FlutterBridge', err);
        }
      }

      // 2. Check window.flutter_inappwebview (flutter_inappwebview plugin)
      if (window.flutter_inappwebview && typeof window.flutter_inappwebview.callHandler === 'function') {
        try {
          window.flutter_inappwebview.callHandler('FlutterBridge', jsonString);
          sentVia.push('window.flutter_inappwebview');
        } catch (err) {
          console.error('[FlutterBridge] Error posting to flutter_inappwebview', err);
        }
      }

      // 3. Fallback: window.parent.postMessage (if embedded in standard iframe/web wrapper)
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage(payload, '*');
          sentVia.push('window.parent.postMessage');
        } catch (err) {
          console.error('[FlutterBridge] Error posting to window.parent', err);
        }
      }
    }

    // Record for debug/history log
    this._recordHistory({
      direction: 'OUTGOING',
      event: eventName,
      payload,
      sentVia: sentVia.length > 0 ? sentVia : ['Console / Standalone Browser'],
    });

    this.log(`[FlutterBridge] 📤 Sent "${eventName}" (${sentVia.join(', ') || 'Standalone Simulator'}):`, payload);

    return payload;
  }

  /**
   * Send Level Completed event to Flutter
   * Output payload: { event: "LEVEL_COMPLETED", gameId, gameTitle, timeStamp, score }
   */
  sendLevelCompleted(score: number | { score?: number; [key: string]: unknown } = 0): BridgePayload {
    const finalScore =
      typeof score === 'object' && score !== null && 'score' in score
        ? Number(score.score) || 0
        : Number(score) || 0;
    return this.send('LEVEL_COMPLETED', finalScore);
  }

  /**
   * Send Game Over event to Flutter
   * Output payload: { event: "GAME_OVER", gameId, gameTitle, timeStamp, score }
   */
  sendGameOver(score: number | { score?: number; [key: string]: unknown } = 0): BridgePayload {
    const finalScore =
      typeof score === 'object' && score !== null && 'score' in score
        ? Number(score.score) || 0
        : Number(score) || 0;
    return this.send('GAME_OVER', finalScore);
  }

  private _recordHistory(item: BridgeHistoryItem): void {
    this.messageHistory.unshift(item);
    if (this.messageHistory.length > this.maxHistoryLength) {
      this.messageHistory.pop();
    }
  }

  getHistory(): BridgeHistoryItem[] {
    return [...this.messageHistory];
  }

  isFlutterEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window.FlutterBridge && typeof window.FlutterBridge.postMessage === 'function') ||
      (window.flutter_inappwebview && typeof window.flutter_inappwebview.callHandler === 'function')
    );
  }
}

export const flutterBridge = new FlutterBridgeService();

// Expose directly to window for easy browser DevTools console testing
if (typeof window !== 'undefined') {
  window.flutterBridge = flutterBridge;
}

export default flutterBridge;
