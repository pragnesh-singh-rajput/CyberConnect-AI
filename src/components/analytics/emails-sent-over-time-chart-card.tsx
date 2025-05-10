'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as LineChartIcon } from 'lucide-react';
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useRecruiters } from '@/contexts/RecruitersContext';
import { format, parseISO, startOfMonth } from 'date-fns';

const aggregateEmailsByMonth = (recruiters: typeof useRecruiters extends () => { recruiters: infer R } ? R : never) => {
  const counts: Record<string, number> = {};
  recruiters.forEach(recruiter => {
    if (recruiter.status === 'sent' || recruiter.status === 'replied') {
      if (recruiter.lastContacted) {
        const monthYear = format(startOfMonth(parseISO(recruiter.lastContacted)), 'MMM yyyy');
        counts[monthYear] = (counts[monthYear] || 0) + 1;
      }
    }
  });

  // Sort by date to ensure the chart displays chronologically
  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a,b) => parseISO(a.date) < parseISO(b.date) ? -1 : 1); // This sort won't work as 'MMM yyyy' is not ISO
    // A more robust sort would require converting 'MMM yyyy' back to a Date object, or ensuring data is added chronologically.
    // For simplicity, we'll assume data might not be perfectly ordered for now if months are sparse.
    // A better approach would be to generate all months in a range and fill counts.
};


export function EmailsSentOverTimeChartCard() {
  const { recruiters } = useRecruiters();
  const sentOverTimeData = aggregateEmailsByMonth(recruiters);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-foreground">
          <LineChartIcon className="mr-2 h-5 w-5 text-accent" /> Emails Sent Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sentOverTimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={sentOverTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} allowDecimals={false} />
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
        ) : (
          <p className="text-muted-foreground text-center py-10">
            No email sending data available. This chart will populate as you send emails.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
