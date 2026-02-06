'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReferralsApi } from '@/lib/api/referrals';
import { Referral, ReferralUsage, CreateReferralRequestSchema, CreateReferralRequest } from '@/lib/schemas/referrals';
import { DataTable } from '@/components/admin/data-table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal, Plus, Ban, CheckCircle, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Usage Dialog State
  const [usages, setUsages] = useState<ReferralUsage[]>([]);
  const [isUsagesDialogOpen, setIsUsagesDialogOpen] = useState(false);
  const [selectedReferralCode, setSelectedReferralCode] = useState('');
  const [isLoadingUsages, setIsLoadingUsages] = useState(false);

  const { toast } = useToast();

  const form = useForm<CreateReferralRequest>({
    resolver: zodResolver(CreateReferralRequestSchema),
    defaultValues: {
      referral_code: '',
      credit_bonus_amount: 2500,
      notes: '',
    },
  });

  const fetchReferrals = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ReferralsApi.getAll();
      setReferrals(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch referrals',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const onSubmit = async (data: CreateReferralRequest) => {
    try {
      await ReferralsApi.create(data);
      toast({
        title: 'Success',
        description: 'Referral code created successfully',
      });
      setIsDialogOpen(false);
      form.reset();
      fetchReferrals();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create referral code',
      });
    }
  };

  const handleExpire = async (id: string) => {
    try {
      await ReferralsApi.expire(id);
      toast({
        title: 'Success',
        description: 'Referral code expired successfully',
      });
      fetchReferrals();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to expire referral code',
      });
    }
  };

  const handleViewUsages = async (referral: Referral) => {
    setSelectedReferralCode(referral.referral_code);
    setIsUsagesDialogOpen(true);
    setIsLoadingUsages(true);
    try {
      const data = await ReferralsApi.getUsages(referral._id);
      setUsages(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch referral usages',
      });
      setUsages([]);
    } finally {
      setIsLoadingUsages(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: 'Copied to clipboard',
    });
  };

  const columns = [
    {
      key: 'referral_code',
      header: 'Code',
      cell: (item: Referral) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">{item.referral_code}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copyToClipboard(item.referral_code)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item: Referral) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
          active: 'default',
          inactive: 'secondary',
          expired: 'destructive',
        };
        return <Badge variant={variants[item.status] || 'outline'}>{item.status}</Badge>;
      },
    },
    {
      key: 'credit_bonus_amount',
      header: 'Bonus Credits',
      cell: (item: Referral) => (
        <span>{item.credit_bonus_amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage Count',
      cell: (item: Referral) => (
        <span>{item.usage_count}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      cell: (item: Referral) => (
        <span>{new Date(item.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (item: Referral) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => copyToClipboard(item.referral_code)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleViewUsages(item)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              View Usages
            </DropdownMenuItem>
            {item.status === 'active' && (
              <DropdownMenuItem
                onClick={() => handleExpire(item._id)}
                className="text-red-600"
              >
                <Ban className="mr-2 h-4 w-4" />
                Expire Code
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Referrals</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Referral
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Referral Code</DialogTitle>
              <DialogDescription>
                Create a new referral code to give bonus credits to users.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="referral_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Code</FormLabel>
                      <FormControl>
                        <Input placeholder="SUMMER2026" {...field} />
                      </FormControl>
                      <FormDescription>
                        The code users will enter during signup.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="credit_bonus_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Bonus Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2500"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount of credits to award (2500 = $25).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Internal notes about this campaign..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={referrals}
        columns={columns}
        searchKey="referral_code"
      />

      <Dialog open={isUsagesDialogOpen} onOpenChange={setIsUsagesDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Referral Usages: {selectedReferralCode}</DialogTitle>
            <DialogDescription>
              List of users who have used this referral code.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoadingUsages ? (
              <div className="flex justify-center py-8">
                Loading...
              </div>
            ) : usages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No usages found for this referral code.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Bonus Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages.map((usage) => (
                    <TableRow key={usage._id}>
                      <TableCell className="font-mono text-xs">{usage.referred_user_id}</TableCell>
                      <TableCell>{usage.bonus_amount}</TableCell>
                      <TableCell>{new Date(usage.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
