import { useCallback } from 'react';

const useWindowScrollLock = () => {
    const preventScroll = useCallback((e: WheelEvent | TouchEvent) => {
        if (e.cancelable) {
            e.preventDefault();
        }
    }, []);

    const options = { passive: false };

    const enableScrollLock = useCallback(() => {
        window.addEventListener('wheel', preventScroll, options);
        window.addEventListener('touchstart', preventScroll, options);
        window.addEventListener('touchmove', preventScroll, options);
    }, [preventScroll]);

    const disableScrollLock = useCallback(() => {
        window.removeEventListener('wheel', preventScroll);
        window.removeEventListener('touchstart', preventScroll);
        window.removeEventListener('touchmove', preventScroll);
    }, [preventScroll]);

    return { enableScrollLock, disableScrollLock };
};

export default useWindowScrollLock;