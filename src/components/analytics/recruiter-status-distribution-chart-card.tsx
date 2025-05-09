'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
import { useRecruiters } from '@/contexts/RecruitersContext';

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function RecruiterStatusDistributionChartCard() {
  const { recruiters } = useRecruiters();

  const statusCounts = recruiters.reduce((acc, recruiter) => {
    acc[recruiter.status] = (acc[recruiter.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-foreground">
          <PieChartIcon className="mr-2 h-5 w-5 text-accent" /> Recruiter Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="hsl(var(--chart-1))" // Default fill, overridden by Cell
                dataKey="value"
                label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                stroke="hsl(var(--background))" // Border for segments for better visual separation
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
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
            </RechartsPieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-center py-10">No recruiter data available to display status distribution.</p>
        )}
      </CardContent>
    </Card>
  );
}
