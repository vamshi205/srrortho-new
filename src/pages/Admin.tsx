import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Database, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AddProcedureForm } from '@/components/admin/AddProcedureForm';
import { migrateLocalStorageToSheets } from '@/lib/savedDcStorage';
import { getConfigurationStatus } from '@/services/dcSheetsService';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const configStatus = getConfigurationStatus();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to DC Generator</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-display font-semibold">Admin Panel</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Add new procedures or edit existing ones with items and instruments
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
        <div className="space-y-6">
          {/* DC Migration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                DC Data Migration
              </CardTitle>
              <CardDescription>
                Migrate existing DCs from local storage to Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-semibold">Google Sheets Status:</span>{' '}
                  {configStatus.configured ? (
                    <span className="text-green-600 font-medium">✓ Configured</span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Not Configured</span>
                  )}
                </div>
                {!configStatus.configured && (
                  <div className="text-xs text-muted-foreground">
                    Configure the Google Apps Script URL in <code className="bg-muted px-1 py-0.5 rounded">src/services/dcSheetsService.ts</code>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This will migrate all DCs stored in your browser's local storage to Google Sheets. 
                  After successful migration, local storage will be cleared to prevent duplicates.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={async () => {
                      if (!configStatus.configured) {
                        toast({
                          title: 'Configuration Required',
                          description: 'Please configure Google Apps Script URL first.',
                          variant: 'destructive',
                        });
                        return;
                      }

                      setIsMigrating(true);
                      try {
                        const result = await migrateLocalStorageToSheets();
                        if (result.success === 0 && result.failed === 0) {
                          toast({
                            title: 'No DCs to migrate',
                            description: 'Local storage is empty or already migrated.',
                          });
                        } else if (result.failed > 0) {
                          toast({
                            title: 'Migration partially completed',
                            description: `Migrated ${result.success} DCs, ${result.failed} failed. Check console for errors.`,
                            variant: 'destructive',
                          });
                        } else {
                          toast({
                            title: 'Migration successful!',
                            description: `Successfully migrated ${result.success} DCs to Google Sheets.`,
                          });
                        }
                      } catch (error) {
                        console.error('Migration error:', error);
                        toast({
                          title: 'Migration failed',
                          description: error instanceof Error ? error.message : 'Unknown error occurred',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsMigrating(false);
                      }
                    }}
                    disabled={!configStatus.configured || isMigrating}
                    className="gap-2"
                  >
                    {isMigrating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        Migrate DCs to Google Sheets
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Procedure Form */}
          <AddProcedureForm />
        </div>
      </main>
    </div>
  );
};

export default Admin;

