import { AlertCircle, Terminal, ChevronRight } from "lucide-react"

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

import { Button } from "./ui/button"

export function Dialog({ msg, title, variant, type }: { msg: string, title: string, variant: any, type: boolean }) {
    return (
        <div className="my-2">
            <Alert variant={variant}>
                {type == true ?
                    <AlertCircle className="h-4 w-4" /> :
                    <Terminal className="h-4 w-4" />
                }
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>
                    {msg}
                </AlertDescription>
            </Alert>
        </div>
    )
}

export function DialogSessions({ msg, href, title, variant, type }: { msg: string, href: string, title: string, variant: any, type: boolean }) {
    return (
        <div className="my-2">
            <a href={href}>
                <Alert variant={variant}>
                    {type == true ?
                        <AlertCircle className="h-4 w-4" /> :
                        <Terminal className="h-4 w-4" />
                    }
                    <AlertTitle>{title}</AlertTitle>
                    <AlertDescription>
                    <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center", // Aligns items vertically in the center
                                width: "100%" // Ensures the full width is used
                            }}
                        >
                            <span>{msg}</span>
                            <span><ChevronRight color="grey" className="h-4 w-4"/></span>
                        </div>
                    </AlertDescription>
                </Alert>
            </a>
        </div>
    )
}
