import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ItemManager() {
  const { toast } = useToast();
  const [itemName, setItemName] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [sizePattern, setSizePattern] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSave = () => {
    if (!itemName.trim()) {
      toast({
        title: 'Error',
        description: 'Item name is required',
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
      description: `Item "${itemName}" added to procedure "${selectedProcedure}"`,
    });

    // Reset form
    setItemName('');
    setSizePattern('');
    setImageUrl('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Item</CardTitle>
        <CardDescription>
          Add items (implants) to procedures. Items can be selectable or fixed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="procedure-select">Select Procedure *</Label>
          <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
            <SelectTrigger id="procedure-select">
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
          <Label htmlFor="item-name">Item Name *</Label>
          <Input
            id="item-name"
            placeholder="e.g., Titanium Plate"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="size-pattern">Size Pattern (Optional)</Label>
          <Input
            id="size-pattern"
            placeholder="e.g., {6mm:1, 8mm:2, 10mm:1}"
            value={sizePattern}
            onChange={(e) => setSizePattern(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Format: {"{Size:Qty, Size:Qty}"} - Leave empty for fixed items
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-url">Image URL (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="image-url"
              placeholder="Google Drive URL or direct image link"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <Button variant="outline" size="icon" title="Upload image">
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1 sm:flex-none">
            <Save className="w-4 h-4 mr-2" />
            Save as Selectable Item
          </Button>
          <Button onClick={handleSave} variant="outline" className="flex-1 sm:flex-none">
            <Save className="w-4 h-4 mr-2" />
            Save as Fixed Item
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-semibold mb-4">Existing Items</h3>
          <p className="text-sm text-muted-foreground">
            Item list management will be available here
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

