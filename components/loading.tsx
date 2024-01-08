// import { UserButton } from "@clerk/nextjs";
"use client";

import '../app/globals.css'


const Loading = () => {

    return (
        <div className="relative flex flex-col mt-60 justify-center items-center">
            <div className="loader"></div>

            <div className='my-5 text-lg font-medium'>loading...</div>
        </div>
    );
}

export default Loading;