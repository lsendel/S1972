import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';
import { Organization } from '@/types/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrgSwitcher() {
  // Fetch user organizations
  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => client.get<Organization[]>('/organizations/'),
  });

  // We need a store or state for "current organization"
  // For now, let's just pick the first one or use a local state.
  // Ideally, this should be in a store like useOrgStore.
  const [currentOrg, setCurrentOrg] = React.useState<string | undefined>(undefined);

  useEffect(() => {
      if (orgs && orgs.length > 0 && !currentOrg) {
          // Default to first org
          // In real app, check localStorage or URL param
          setCurrentOrg(orgs[0].slug);
      }
  }, [orgs, currentOrg]);

  const handleOrgChange = (slug: string) => {
      if (slug === 'new') {
          // Navigate to create org page
          // navigate('/app/organizations/new')
          console.log("Create new org");
          return;
      }
      setCurrentOrg(slug);
      // Also update global store or context so other queries can use the org slug
  };

  if (isLoading) {
      return <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
  }

  return (
    <Select value={currentOrg} onValueChange={handleOrgChange}>
      <SelectTrigger className="w-full">
        <div className="flex items-center">
            <Building2 size={16} className="mr-2 text-gray-500"/>
            <SelectValue placeholder="Select Organization" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {orgs && (orgs as any).data && (orgs as any).data.map((org: Organization) => (
          <SelectItem key={org.id} value={org.slug}>
            {org.name}
          </SelectItem>
        ))}
        <div className="p-2 border-t mt-1">
            <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2 text-primary" onClick={(e) => {
                e.preventDefault();
                handleOrgChange('new');
            }}>
                <Plus size={14} className="mr-2"/>
                Create Organization
            </Button>
        </div>
      </SelectContent>
    </Select>
  );
}
