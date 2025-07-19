import { useCallback } from 'react';

const useWindowScrollLock = () => {
    const preventScroll = useCallback((e: WheelEvent | TouchEvent) => {
        e.preventDefault();
    }, []);

    const enableScrollLock = useCallback(() => {
        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });
    }, [preventScroll]);

    const disableScrollLock = useCallback(() => {
        window.removeEventListener('wheel', preventScroll);
        window.removeEventListener('touchmove', preventScroll);
    }, [preventScroll]);

    return { enableScrollLock, disableScrollLock };
};

export default useWindowScrollLock;