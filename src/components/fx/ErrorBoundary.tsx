import { Component, type ReactNode } from "react";

export class FxErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[ai.lab] WebGL scene failed, using fallback", err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
