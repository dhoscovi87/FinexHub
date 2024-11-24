import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Globe, Shield, LogOut } from "lucide-react";

export default function ProfilePage() {
  const languages = [
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
    { value: "fon", label: "Fon" },
  ];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card className="p-4 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="font-semibold">John Doe</h2>
            <p className="text-sm text-muted-foreground">ID: 123456</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <Label>Phone Number</Label>
            <div className="flex space-x-2">
              <Input value="+229 12345678" readOnly />
              <Button variant="outline" size="icon">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Language</Label>
            <Select defaultValue="fr">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="font-semibold flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Security
        </h2>

        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Change PIN
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Enable Biometric Login
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Transaction Limits
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h2 className="font-semibold flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Connected Services
        </h2>

        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Manage MoMo Accounts
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Link Bank Account
          </Button>
        </div>
      </Card>

      <Button variant="destructive" className="w-full">
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
