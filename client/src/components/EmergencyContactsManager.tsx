import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEmergencyContacts, useCreateEmergencyContact, useUpdateEmergencyContact, useDeleteEmergencyContact } from "@/hooks/useEmergencyContacts";
import { Plus, Pencil, Trash2, Phone, Mail, Shield } from "lucide-react";
import type { EmergencyContact, InsertEmergencyContact } from "@shared/schema";

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  relationship: string;
  priority: 'primary' | 'secondary';
}

export default function EmergencyContactsManager() {
  const { toast } = useToast();
  const { data: contacts = [], isLoading } = useEmergencyContacts();
  const createContact = useCreateEmergencyContact();
  const updateContact = useUpdateEmergencyContact();
  const deleteContact = useDeleteEmergencyContact();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    priority: 'secondary'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: '',
      priority: 'secondary'
    });
    setEditingContact(null);
  };

  const handleOpenDialog = (contact?: EmergencyContact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        relationship: contact.relationship,
        priority: contact.priority as 'primary' | 'secondary'
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.relationship) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingContact) {
        await updateContact.mutateAsync({
          id: editingContact.id.toString(),
          updates: formData
        });
        toast({
          title: "Contact Updated",
          description: `${formData.name} has been updated successfully`
        });
      } else {
        await createContact.mutateAsync(formData as InsertEmergencyContact);
        toast({
          title: "Contact Added",
          description: `${formData.name} has been added to your emergency contacts`
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save emergency contact",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (contact: EmergencyContact) => {
    if (!confirm(`Are you sure you want to remove ${contact.name} from your emergency contacts?`)) {
      return;
    }

    try {
      await deleteContact.mutateAsync(contact.id.toString());
      toast({
        title: "Contact Removed",
        description: `${contact.name} has been removed from your emergency contacts`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove emergency contact",
        variant: "destructive"
      });
    }
  };

  const primaryContacts = contacts.filter(c => c.priority === 'primary');
  const secondaryContacts = contacts.filter(c => c.priority === 'secondary');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contacts</CardTitle>
          <CardDescription>Loading your emergency contacts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Emergency Contacts</CardTitle>
            <CardDescription>
              Manage contacts who will be notified during emergencies
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
                </DialogTitle>
                <DialogDescription>
                  {editingContact 
                    ? 'Update the contact information below'
                    : 'Add a new emergency contact who will be notified during alerts'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Contact name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="relationship">Relationship *</Label>
                    <Input
                      id="relationship"
                      value={formData.relationship}
                      onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                      placeholder="Spouse, Parent, Friend"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'primary' | 'secondary') => 
                        setFormData(prev => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createContact.isPending || updateContact.isPending}>
                    {editingContact ? 'Update Contact' : 'Add Contact'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {primaryContacts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-red-500" />
              <h3 className="font-semibold">Primary Contacts</h3>
              <Badge variant="destructive" className="text-xs">High Priority</Badge>
            </div>
            <div className="grid gap-3">
              {primaryContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={() => handleOpenDialog(contact)}
                  onDelete={() => handleDelete(contact)}
                />
              ))}
            </div>
          </div>
        )}

        {secondaryContacts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold">Secondary Contacts</h3>
              <Badge variant="secondary" className="text-xs">Standard Priority</Badge>
            </div>
            <div className="grid gap-3">
              {secondaryContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={() => handleOpenDialog(contact)}
                  onDelete={() => handleDelete(contact)}
                />
              ))}
            </div>
          </div>
        )}

        {contacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No emergency contacts added yet</p>
            <p className="text-sm">Add contacts who should be notified during emergencies</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ContactCardProps {
  contact: EmergencyContact;
  onEdit: () => void;
  onDelete: () => void;
}

function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{contact.name}</h4>
          <Badge variant={contact.priority === 'primary' ? 'destructive' : 'secondary'} className="text-xs">
            {contact.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {contact.phone}
          </div>
          {contact.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {contact.email}
            </div>
          )}
          <span>• {contact.relationship}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}