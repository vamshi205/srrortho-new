import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InstrumentManager() {
  const { toast } = useToast();
  const [instrumentName, setInstrumentName] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSave = () => {
    if (!instrumentName.trim()) {
      toast({
        title: 'Error',
        description: 'Instrument name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedProcedure) {
      toast({
        title: 'Error',
        description: 'Please select a procedure',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implement save to Google Sheets/Firebase
    toast({
      title: 'Success',
      description: `Instrument "${instrumentName}" added to procedure "${selectedProcedure}"`,
    });

    // Reset form
    setInstrumentName('');
    setImageUrl('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Instrument</CardTitle>
        <CardDescription>
          Add instruments (tools and equipment) to procedures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="procedure-select-instrument">Select Procedure *</Label>
          <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
            <SelectTrigger id="procedure-select-instrument">
              <SelectValue placeholder="Choose a procedure" />
            </SelectTrigger>
            <SelectContent>
              {/* TODO: Load procedures from data source */}
              <SelectItem value="procedure1">Procedure 1</SelectItem>
              <SelectItem value="procedure2">Procedure 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instrument-name">Instrument Name *</Label>
          <Input
            id="instrument-name"
            placeholder="e.g., Bone Drill, Screwdriver"
            value={instrumentName}
            onChange={(e) => setInstrumentName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instrument-image-url">Image URL (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="instrument-image-url"
              placeholder="Google Drive URL or direct image link"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Button variant="outline" size="icon" title="Upload image">
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          Save Instrument
        </Button>

        <div className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-semibold mb-4">Existing Instruments</h3>
          <p className="text-sm text-muted-foreground">
            Instrument list management will be available here
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

