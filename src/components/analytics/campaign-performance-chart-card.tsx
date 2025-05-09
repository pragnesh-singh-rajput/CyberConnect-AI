'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart as BarChartIcon } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const mockCampaignPerformanceData = [
  { name: 'Campaign A', sent: 100, opened: 60, replied: 15 },
  { name: 'Campaign B', sent: 150, opened: 90, replied: 20 },
  { name: 'Campaign C', sent: 120, opened: 70, replied: 25 },
];

export function CampaignPerformanceChartCard() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-foreground">
          <BarChartIcon className="mr-2 h-5 w-5 text-accent" /> Campaign Performance (Illustrative)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-2">Note: This chart uses mock data for demonstration purposes.</p>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={mockCampaignPerformanceData}>
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
            <Bar dataKey="opened" fill="hsl(var(--chart-2))" name="Opened" radius={[4, 4, 0, 0]} />
            <Bar dataKey="replied" fill="hsl(var(--chart-3))" name="Replied" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
