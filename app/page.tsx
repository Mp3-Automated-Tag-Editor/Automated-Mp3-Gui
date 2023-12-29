'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Main() {
    const router = useRouter();

    useEffect(() => {
        setTimeout(() => {
            router.push('/dashboard')
        }, 1000)
    }, []);



return (
    <div>Loading...</div>
);
}