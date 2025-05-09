'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Recruiter } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowUpDown, MoreHorizontal, Trash2, Edit3, Mail, Send, Eye, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

const statusVariantMap: Record<Recruiter['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  personalized: 'default',
  sent: 'default',
  replied: 'secondary', // Use success color from theme if available, or secondary
  saved: 'outline',
  error: 'destructive',
};


export const getColumns = (
  onPersonalize: (recruiter: Recruiter) => void,
  onDelete: (recruiter: Recruiter) => void,
  onSave: (recruiter: Recruiter) => void,
  onMarkReplied: (recruiter: Recruiter) => void,
  onViewEmail: (recruiter: Recruiter) => void
): ColumnDef<Recruiter>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'recruiterName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Recruiter Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue('recruiterName')}</div>,
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
  },
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Recruiter['status'];
      return <Badge variant={statusVariantMap[status] || 'outline'} className="capitalize">{status}</Badge>;
    },
  },
  {
    accessorKey: 'lastContacted',
    header: 'Last Contacted',
    cell: ({ row }) => {
      const date = row.getValue('lastContacted') as string | undefined;
      return date ? format(parseISO(date), 'MMM dd, yyyy') : 'N/A';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const recruiter = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(recruiter.status === 'pending' || recruiter.status === 'saved' || recruiter.status === 'error') && (
              <DropdownMenuItem onClick={() => onPersonalize(recruiter)}>
                <Mail className="mr-2 h-4 w-4" />
                Personalize & Send
              </DropdownMenuItem>
            )}
             {recruiter.status === 'pending' && (
              <DropdownMenuItem onClick={() => onSave(recruiter)}>
                <Save className="mr-2 h-4 w-4" />
                Save (No Email)
              </DropdownMenuItem>
            )}
            {recruiter.status === 'sent' && (
               <>
                <DropdownMenuItem onClick={() => onViewEmail(recruiter)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Sent Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMarkReplied(recruiter)}>
                  <Send className="mr-2 h-4 w-4" /> {/* Using Send as a reply indicator */}
                  Mark as Replied
                </DropdownMenuItem>
               </>
            )}
            {recruiter.status === 'replied' && (
                 <DropdownMenuItem onClick={() => onViewEmail(recruiter)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Sent Email
                </DropdownMenuItem>
            )}
            {/* Add Edit functionality later if needed
            <DropdownMenuItem asChild>
              <Link href={`/recruits/${recruiter.id}/edit`}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            */}
            <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onClick={() => onDelete(recruiter)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
