"use client";

import { UserCircle, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cliente } from "@/types";

interface ClientContactsCardProps {
  contacts: Cliente["contacts"];
}

export function ClientContactsCard({ contacts }: ClientContactsCardProps) {
  if (!contacts || contacts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Contactos Adicionales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.map((contact, index) => (
          <div 
            key={index} 
            className="p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors space-y-2"
          >
            <div className="flex items-center gap-2 font-medium">
              <UserCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm">{contact.name}</span>
            </div>
            
            <div className="grid grid-cols-1 gap-1 ml-6">
              {contact.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" aria-hidden="true" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" aria-hidden="true" />
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
