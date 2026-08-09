import React from "react";

export class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      // Raw CSS `red` is #ff0000, which is the one red the theme never defines
      // and lands at 5.25:1 here purely by luck. This is the theme's error red.
      return <div style={{ color: "#ff6b6b", padding: 16 }}>Error: {String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}
