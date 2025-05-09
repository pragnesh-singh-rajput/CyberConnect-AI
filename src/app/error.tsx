
'use client'; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans bg-background text-foreground">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="mt-4 text-2xl">Something went wrong!</CardTitle>
              <CardDescription>
                We encountered an unexpected error. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && error?.message && (
                <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground overflow-auto max-h-32">
                  <p className="font-semibold">Error details (Development Mode):</p>
                  <pre className="whitespace-pre-wrap">{error.message}</pre>
                  {error.digest && <p className="mt-1">Digest: {error.digest}</p>}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => reset()} size="lg">
                Try Again
              </Button>
            </CardFooter>
          </Card>
          <p className="mt-8 text-sm text-muted-foreground">
            If the problem persists, please contact support.
          </p>
        </div>
      </body>
    </html>
  );
}
