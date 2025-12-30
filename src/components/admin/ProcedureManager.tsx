import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ProcedureManager() {
  const { toast } = useToast();
  const [procedureName, setProcedureName] = useState('');
  const [procedureType, setProcedureType] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!procedureName.trim()) {
      toast({
        title: 'Error',
        description: 'Procedure name is required',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implement save to Google Sheets/Firebase
    toast({
      title: 'Success',
      description: `Procedure "${procedureName}" saved successfully`,
    });

    // Reset form
    setProcedureName('');
    setProcedureType('');
    setDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Procedure</CardTitle>
        <CardDescription>
          Create a new procedure that can be used in delivery challans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="procedure-name">Procedure Name *</Label>
          <Input
            id="procedure-name"
            placeholder="e.g., Total Hip Replacement"
            value={procedureName}
            onChange={(e) => setProcedureName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="procedure-type">Procedure Type</Label>
          <Select value={procedureType} onValueChange={setProcedureType}>
            <SelectTrigger id="procedure-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Surgery">Surgery</SelectItem>
              <SelectItem value="Trauma">Trauma</SelectItem>
              <SelectItem value="Spine">Spine</SelectItem>
              <SelectItem value="Orthopedic">Orthopedic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Add any notes or description about this procedure"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSave} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          Save Procedure
        </Button>

        <div className="mt-8 pt-6 border-t">
          <h3 className="text-sm font-semibold mb-4">Existing Procedures</h3>
          <p className="text-sm text-muted-foreground">
            Procedure list management will be available here
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

