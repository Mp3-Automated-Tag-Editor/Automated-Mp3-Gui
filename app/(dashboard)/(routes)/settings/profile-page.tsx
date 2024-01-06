
import { ProfileForm } from "./profile-form"
import { Separator } from "@/components/ui/separator"

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure the Settings related to the Scraper.
        </p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  )
}
