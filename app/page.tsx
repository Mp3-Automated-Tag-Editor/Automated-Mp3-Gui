'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ROUTES } from '@/constants';

export default function Main() {
    const router = useRouter();

    useEffect(() => {
        setTimeout(() => {
            router.push(ROUTES.dashboard)
        }, 100)
    }, []);

    return (
        <div>Loading...</div>
    );
}
