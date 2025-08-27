import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-6 text-2xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Website V2
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A social media platform for capturing public sentiment through AI-generated questions from news events.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📰 News Ingestion
              </CardTitle>
              <CardDescription>
                AI-powered clustering of news articles into events with neutral question generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming in future steps: Epic B implementation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Stance Capture
              </CardTitle>
              <CardDescription>
                Express opinions on a -2 to +2 scale with optional reasoning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming in future steps: Epic D implementation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🌐 Community Pulse
              </CardTitle>
              <CardDescription>
                Aggregated insights and trends from community responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming in future steps: Epic F implementation
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Step 0 Complete: Project scaffolding and foundation ready
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;