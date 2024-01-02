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

export default function Alert({ initial = false, msg, header, func }: {
    initial: boolean,
    msg: string,
    header: string,
    func: any
}) {
    const [open, setOpen] = useState(initial);
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
                    <Button onClick={() => {
                        setOpen(!open);
                        // func(!open);
                    }}>Ok</Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}