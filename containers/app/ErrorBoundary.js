import React from 'react';

// https://reactjs.org/docs/error-boundaries.html#introducing-error-boundaries
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        const logErrorToMyService = () => {};
        // You can also log the error to an error reporting service
        logErrorToMyService(error, info);
    }

    render() {
        const error = this.state.error ? this.state.error.toString() : undefined;
        console.log(this.state.error);
        if (this.state.hasError) {
            debugger
            // You can render any custom fallback UI
            return (
                <>
                    <h1>Something went wrong.</h1>
                    <span>{error}</span>
                </>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
