'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as LineChartIcon } from 'lucide-react';
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const mockSentOverTimeData = [
  { date: 'Jan', count: 10 },
  { date: 'Feb', count: 15 },
  { date: 'Mar', count: 12 },
  { date: 'Apr', count: 20 },
  { date: 'May', count: 25 },
  { date: 'Jun', count: 18 },
];

export function EmailsSentOverTimeChartCard() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-foreground">
          <LineChartIcon className="mr-2 h-5 w-5 text-accent" /> Emails Sent Over Time (Illustrative)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-2">Note: This chart uses mock data for demonstration purposes.</p>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={mockSentOverTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
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
            <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} activeDot={{ r: 6, fill: 'hsl(var(--chart-1))', stroke: 'hsl(var(--background))', strokeWidth: 2 }} name="Emails Sent" dot={{r: 4, fill: 'hsl(var(--chart-1))'}} />
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
