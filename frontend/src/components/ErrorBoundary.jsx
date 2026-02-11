
import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white flex items-center justify-center p-8 font-mono">
                    <div className="max-w-2xl w-full border border-red-500/30 bg-red-900/10 p-8 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center gap-4 text-red-500 mb-6">
                            <AlertTriangle size={32} />
                            <h1 className="text-2xl font-bold tracking-widest uppercase">System Failure</h1>
                        </div>

                        <div className="bg-black/50 p-4 rounded-lg border border-red-500/10 overflow-auto max-h-64 mb-6">
                            <p className="text-red-300 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                            <pre className="text-red-500/50 text-xs whitespace-pre-wrap">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </div>

                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase tracking-widest text-xs transition-colors"
                        >
                            System Reboot
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
