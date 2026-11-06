import { Component } from 'react';
import { reportError } from '../monitoring';

const COPY = {
    it: { title: 'Qualcosa è andato storto', text: 'Ricarica la pagina per riprovare.', button: 'Ricarica' },
    en: { title: 'Something went wrong', text: 'Reload the page to try again.', button: 'Reload' },
};

export default class ErrorBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error) {
        reportError(error);
    }

    render() {
        if (!this.state.failed) return this.props.children;

        const copy = COPY[document.documentElement.lang] ?? COPY.it;
        return (
            <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '2rem' }}>{copy.title}</h1>
                    <p style={{ margin: '12px 0 24px', color: 'var(--muted)' }}>{copy.text}</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        style={{ padding: '12px 24px', border: 0, borderRadius: 999, background: 'var(--moss)', color: '#fff', fontWeight: 600 }}
                    >
                        {copy.button}
                    </button>
                </div>
            </main>
        );
    }
}
