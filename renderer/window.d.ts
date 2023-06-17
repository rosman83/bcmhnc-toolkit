// This file should augment the properties of the `Window` with the type of the
// `ContextBridgeApi` from `Electron.contextBridge` declared in `src/preload.ts`.
import type { ContextBridgeApi } from '../main/preload'

declare global {
  interface Window {
    api: ContextBridgeApi
  }
}