"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Button } from "./ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Alert({ initial = false, msg, header, func, type = 0, goBackFunc, retryFunc }: {
    initial: boolean,
    msg: string,
    header: string,
    func: any,
    type: number,
    goBackFunc: any,
    retryFunc: any
}) {
    const [open, setOpen] = useState(initial);
    const router = useRouter();

    const handleClick = () => {
        
    };
    return (
        <AlertDialog open={open} >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{header}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {msg}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {
                        type == 1 ?
                            <>
                                <Button onClick={() => {
                                    setOpen(!open);
                                    goBackFunc(1)
                                }}>Go Back</Button>
                                <Button onClick={() => {
                                    setOpen(!open);
                                    retryFunc()
                                }}>Retry</Button>
                            </>
                            :
                            <Button onClick={() => {
                                setOpen(!open);
                                // func(!open);
                            }}>Ok</Button>
                    }
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}