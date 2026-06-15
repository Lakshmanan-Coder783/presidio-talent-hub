import React, { useState } from 'react';
import { ShieldAlert, Cpu, Network, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export const Settings: React.FC = () => {
  const [successSaved, setSuccessSaved] = useState(false);
  const [platformName, setPlatformName] = useState('Presidio Talent Hub');
  const [proctoring, setProctoring] = useState(true);
  const [tabSwitchLimit, setTabSwitchLimit] = useState('3');
  const [copyPasteBlock, setCopyPasteBlock] = useState(true);
  const [tenantId, setTenantId] = useState('common');
  const [clientId, setClientId] = useState('c5e23308-181a-45ab-bda3-e5679c375193');

  const handleSave = () => {
    setSuccessSaved(true);
    setTimeout(() => setSuccessSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure default corporate setups, proctoring security parameters, and Entra ID SSO credentials.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Cpu className="h-3.5 w-3.5" />
            General Config
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            Assessment Security
          </TabsTrigger>
          <TabsTrigger value="sso" className="gap-2">
            <Network className="h-3.5 w-3.5" />
            Single Sign-On (SSO)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Enterprise Platform Name</Label>
                <Input value={platformName} onChange={e => setPlatformName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Session Timeout Limit (minutes)</Label>
                <Input type="number" defaultValue="120" />
              </div>
              <div className="space-y-1.5">
                <Label>System Timezone</Label>
                <Select defaultValue="IST">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IST">India Standard Time (IST - UTC+05:30)</SelectItem>
                    <SelectItem value="EST">Eastern Standard Time (EST - UTC-05:00)</SelectItem>
                    <SelectItem value="GMT">Greenwich Mean Time (GMT - UTC+00:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Security &amp; Proctoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="proctoring-switch">AI-Proctoring Camera Monitoring</Label>
                  <p className="text-xs text-muted-foreground">
                    Requires candidate camera permissions to enable live monitoring.
                  </p>
                </div>
                <Switch
                  id="proctoring-switch"
                  checked={proctoring}
                  onCheckedChange={setProctoring}
                />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label>Max Allowed Tab Switches / Navigation Violations</Label>
                <Input
                  type="number"
                  value={tabSwitchLimit}
                  onChange={e => setTabSwitchLimit(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The test will automatically terminate if the candidate switches tabs more than this limit.
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="copypaste-switch">Disable Right-click &amp; Copy-Paste in Coding IDE</Label>
                  <p className="text-xs text-muted-foreground">
                    Prevents plagiarism in coding and SQL sections.
                  </p>
                </div>
                <Switch
                  id="copypaste-switch"
                  checked={copyPasteBlock}
                  onCheckedChange={setCopyPasteBlock}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sso" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Microsoft Entra ID (Azure AD) SSO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label>Directory Tenant ID</Label>
                <Input value={tenantId} onChange={e => setTenantId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Application Client ID</Label>
                <Input value={clientId} onChange={e => setClientId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Redirect OAuth URI</Label>
                <Input defaultValue="https://talent.presidio.com/auth/openid/callback" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-3 pt-2">
        {successSaved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            Settings saved successfully!
          </span>
        )}
        <Button onClick={handleSave}>Save Configurations</Button>
      </div>
    </div>
  );
};
