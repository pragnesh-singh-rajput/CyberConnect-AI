'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart as BarChartIcon } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useRecruiters } from '@/contexts/RecruitersContext'; // Assuming campaign data might derive from recruiters or a future campaigns context

// This is a placeholder. In a real app, you'd derive this data from your actual campaigns.
// For now, it will be empty, and the chart will show a "no data" message.
const campaignPerformanceData: { name: string; sent: number; opened: number; replied: number }[] = [
  // Example structure if data existed:
  // { name: 'Campaign Alpha', sent: 50, opened: 20, replied: 5 },
  // { name: 'Campaign Beta', sent: 75, opened: 30, replied: 10 },
];


export function CampaignPerformanceChartCard() {
  // const { campaigns } = useCampaigns(); // Example: if you had a campaigns context
  // const data = processCampaignsForChart(campaigns); // Process real data

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-foreground">
          <BarChartIcon className="mr-2 h-5 w-5 text-accent" /> Campaign Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {campaignPerformanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={campaignPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' 
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
              />
              <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))', paddingTop: '10px'}}/>
              <Bar dataKey="sent" fill="hsl(var(--chart-1))" name="Sent" radius={[4, 4, 0, 0]} />
              <Bar dataKey="opened" fill="hsl(var(--chart-2))" name="Opened (Est.)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="replied" fill="hsl(var(--chart-3))" name="Replied" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-center py-10">
            No campaign data available. Campaign analytics will appear here once campaigns are tracked.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
