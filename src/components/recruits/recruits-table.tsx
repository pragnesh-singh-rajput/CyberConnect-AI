'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useRecruiters } from '@/contexts/RecruitersContext';
import { useTemplates } from '@/contexts/TemplatesContext';
import { getColumns } from './recruits-table-columns';
import { PersonalizeEmailDialog } from './personalize-email-dialog';
import { ViewEmailDialog } from './view-email-dialog';
import type { Recruiter } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function RecruitersTable() {
  const { recruiters, updateRecruiter, deleteRecruiter } = useRecruiters();
  const { templates, userSkills, setUserSkills: updateGlobalUserSkills } = useTemplates();
  const { toast } = useToast();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const [isPersonalizeDialogOpen, setIsPersonalizeDialogOpen] = React.useState(false);
  const [isViewEmailDialogOpen, setIsViewEmailDialogOpen] = React.useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = React.useState<Recruiter | null>(null);
  const [recruiterToDelete, setRecruiterToDelete] = React.useState<Recruiter | null>(null);


  const handlePersonalize = React.useCallback((recruiter: Recruiter) => {
    setSelectedRecruiter(recruiter);
    setIsPersonalizeDialogOpen(true);
  }, []);

  const handleDeletePrompt = React.useCallback((recruiter: Recruiter) => {
    setRecruiterToDelete(recruiter);
  }, []);
  
  const confirmDelete = React.useCallback(() => {
    if (recruiterToDelete) {
      deleteRecruiter(recruiterToDelete.id);
      toast({ title: 'Recruiter Deleted', description: `${recruiterToDelete.recruiterName} has been deleted.`, variant: 'default' });
      setRecruiterToDelete(null);
    }
  }, [recruiterToDelete, deleteRecruiter, toast]);

  const handleSave = React.useCallback((recruiter: Recruiter) => {
    updateRecruiter({ ...recruiter, status: 'saved' });
    toast({ title: 'Recruiter Saved', description: `${recruiter.recruiterName} has been saved without sending an email.`, variant: 'default' });
  }, [updateRecruiter, toast]);

  const handleMarkReplied = React.useCallback((recruiter: Recruiter) => {
    updateRecruiter({ ...recruiter, status: 'replied', lastContacted: new Date().toISOString() });
    toast({ title: 'Marked as Replied', description: `Email to ${recruiter.recruiterName} marked as replied.`, variant: 'default' });
  }, [updateRecruiter, toast]);
  
  const handleViewEmail = React.useCallback((recruiter: Recruiter) => {
    setSelectedRecruiter(recruiter);
    setIsViewEmailDialogOpen(true);
  }, []);


  const handleEmailSent = React.useCallback((recruiter: Recruiter, subject: string, body: string) => {
    updateRecruiter({
      ...recruiter,
      status: 'sent',
      lastContacted: new Date().toISOString(),
      personalizedEmailSubject: subject,
      personalizedEmailBody: body,
    });
    toast({ title: 'Email Sent!', description: `Personalized email sent to ${recruiter.recruiterName}.`, variant: 'default' });
  }, [updateRecruiter, toast]);

  const columns = React.useMemo(() => getColumns(handlePersonalize, handleDeletePrompt, handleSave, handleMarkReplied, handleViewEmail), [handlePersonalize, handleDeletePrompt, handleSave, handleMarkReplied, handleViewEmail]);

  const table = useReactTable({
    data: recruiters,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter by recruiter name..."
          value={(table.getColumn('recruiterName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('recruiterName')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card className="shadow-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No recruiters found. Add some to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <PersonalizeEmailDialog
        recruiter={selectedRecruiter}
        templates={templates}
        userSkills={userSkills}
        isOpen={isPersonalizeDialogOpen}
        onOpenChange={setIsPersonalizeDialogOpen}
        onEmailSent={handleEmailSent}
        onUpdateUserSkills={updateGlobalUserSkills}
      />
      
      <ViewEmailDialog
        recruiter={selectedRecruiter}
        isOpen={isViewEmailDialogOpen}
        onOpenChange={setIsViewEmailDialogOpen}
      />

      {recruiterToDelete && (
        <AlertDialog open={!!recruiterToDelete} onOpenChange={() => setRecruiterToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the recruiter profile for {recruiterToDelete.recruiterName}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRecruiterToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
