import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-white bg-red-950 min-h-screen font-mono">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <p className="font-bold text-red-300 mb-4">{this.state.error?.toString()}</p>
                    <pre className="bg-black/50 p-4 rounded overflow-auto text-xs whitespace-pre-wrap">
                        {this.state.errorInfo?.componentStack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
