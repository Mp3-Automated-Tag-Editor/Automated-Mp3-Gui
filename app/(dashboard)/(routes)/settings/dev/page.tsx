import { Separator } from "@/components/ui/separator"
import { DisplayForm } from "./display-form"

export default function SettingsDisplayPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Developer Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your Developer Settings.
        </p>
      </div>
      <Separator />
      <DisplayForm />
    </div>
  )
}
