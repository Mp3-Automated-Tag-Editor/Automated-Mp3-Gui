import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface HeadingProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  otherProps?: string;
}

export const Heading = ({
  title,
  description,
  icon: Icon,
  iconColor,
  bgColor,
  otherProps
}: HeadingProps) => {
  return (
    <div className={cn("flex items-center gap-x-3 px-4 lg:px-8 pt-4", otherProps)}>
      <div className={cn("w-fit shrink-0 rounded-md p-2", bgColor)}>
        <Icon className={cn("h-10 w-10", iconColor)} />
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-2xl font-bold leading-tight sm:text-3xl">
          {title}
        </h2>
        <p className="truncate text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
