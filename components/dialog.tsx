import { AlertCircle, Terminal } from "lucide-react"

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

export default function Dialog({ msg, title, variant, type }: { msg: string, title: string, variant: any, type: boolean }) {
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
