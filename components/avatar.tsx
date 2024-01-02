import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "./ui/button";
import { CalendarDays } from "lucide-react"


export default function AvatarCircle() {
    return (
        <div className="position: fixed">
            <HoverCard>
                <HoverCardTrigger asChild>
                    <Button variant="link">
                        <Avatar>
                            <AvatarImage src="/logo.png" />
                            <AvatarFallback>VC</AvatarFallback>
                        </Avatar>
                    </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                        <Avatar>
                            <AvatarImage src="/logo.png" />
                            <AvatarFallback>VC</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold">@AutoMp3</h4>
                            <p className="text-sm">
                                Automated Mp3 Tag Editor, created and maintained by JRS Studios.
                            </p>
                            <p className="text-sm">
                                We&apos;re working on a User Model with Clerk, keep a look out for future updated!
                            </p>
                            <div className="flex items-center pt-2">
                                <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{" "}
                                <span className="text-xs text-muted-foreground">
                                    Joined December 2023
                                </span>
                            </div>
                        </div>
                    </div>
                </HoverCardContent>
            </HoverCard>
        </div>
    );
}