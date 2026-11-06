import { useEffect, useRef, useState } from 'react';

export default function Reveal({ as = 'div', className = '', style, children, ...props }) {
    const Tag = as;
    const ref = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node || typeof IntersectionObserver === 'undefined') {
            setShown(true);
            return undefined;
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setShown(true);
                observer.disconnect();
            }
        }, { threshold: 0.12 });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <Tag ref={ref} className={`reveal${shown ? ' in' : ''} ${className}`.trim()} style={style} {...props}>
            {children}
        </Tag>
    );
}
