import { Component, type ReactNode } from "react";

export class FxErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(err: unknown) {
    console.warn("[ai.lab] WebGL scene failed, using fallback", err);
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
