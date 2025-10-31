import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Key, Download, Upload, Shield, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { generateKeyPair } from '@/lib/fhe';
import { get, set } from 'idb-keyval';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [useWalletKeys, setUseWalletKeys] = useState(false);
  const [autoUpload, setAutoUpload] = useState(true);
  const [shareableProofs, setShareableProofs] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setIsDarkMode(savedTheme === 'dark');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
  }, []);
  
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
    
    toast.success(`Switched to ${newTheme} mode`);
  };

  const handleGenerateKeys = async () => {
    setGenerating(true);
    try {
      const { publicKey, privateKey } = await generateKeyPair();
      
      // Store in IndexedDB
      await set('fhe_public_key', publicKey);
      await set('fhe_private_key', privateKey);
      
      toast.success('New keypair generated and stored securely');
    } catch (error) {
      console.error('Error generating keys:', error);
      toast.error('Failed to generate keypair');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportKeys = async () => {
    try {
      const publicKey = await get('fhe_public_key');
      const privateKey = await get('fhe_private_key');
      
      if (!publicKey || !privateKey) {
        toast.error('No keys found. Generate keys first.');
        return;
      }

      const keyData = {
        publicKey,
        privateKey,
        exported: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fhe-keys-backup.json';
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Keys exported successfully');
    } catch (error) {
      console.error('Error exporting keys:', error);
      toast.error('Failed to export keys');
    }
  };

  const handleImportKeys = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      try {
        const file = e.target.files[0];
        const text = await file.text();
        const keyData = JSON.parse(text);

        await set('fhe_public_key', keyData.publicKey);
        await set('fhe_private_key', keyData.privateKey);

        toast.success('Keys imported successfully');
      } catch (error) {
        console.error('Error importing keys:', error);
        toast.error('Failed to import keys');
      }
    };
    input.click();
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground">
            Manage your encryption keys and privacy preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Encryption Keys */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t('settings.keys')}
              </CardTitle>
              <CardDescription>
                Manage your local encryption keys for FHE operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGenerateKeys}
                disabled={generating}
                className="w-full"
              >
                {generating ? 'Generating...' : t('settings.generateNew')}
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={handleExportKeys}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('settings.exportKeys')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImportKeys}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t('settings.importKeys')}
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  ⚠️ Keep your private keys secure. If lost, you cannot decrypt your expenses.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Options */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="wallet-keys">{t('settings.useWalletKeys')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Derive encryption keys from wallet signature
                  </p>
                </div>
                <Switch
                  id="wallet-keys"
                  checked={useWalletKeys}
                  onCheckedChange={setUseWalletKeys}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-upload">{t('settings.autoUpload')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically upload encrypted data to IPFS
                  </p>
                </div>
                <Switch
                  id="auto-upload"
                  checked={autoUpload}
                  onCheckedChange={setAutoUpload}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="shareable">{t('settings.shareableProofs')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate one-time view keys for sharing
                  </p>
                </div>
                <Switch
                  id="shareable"
                  checked={shareableProofs}
                  onCheckedChange={setShareableProofs}
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                {t('settings.theme')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme-toggle">{isDarkMode ? t('settings.darkMode') : t('settings.lightMode')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  </p>
                </div>
                <Switch
                  id="theme-toggle"
                  checked={isDarkMode}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>{t('settings.language')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={i18n.language === 'en' ? 'default' : 'outline'}
                  onClick={() => i18n.changeLanguage('en')}
                  className="w-full"
                >
                  English
                </Button>
                <Button
                  variant={i18n.language === 'pa' ? 'default' : 'outline'}
                  onClick={() => i18n.changeLanguage('pa')}
                  className="w-full"
                >
                  ਪੰਜਾਬੀ
                </Button>
                <Button
                  variant={i18n.language === 'hi' ? 'default' : 'outline'}
                  onClick={() => i18n.changeLanguage('hi')}
                  className="w-full"
                >
                  हिंदी
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
