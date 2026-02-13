import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, FileText, Globe, PaintBucket, BarChart3, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">QualityCheck</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/assessments" className="text-sm font-medium">
              Assessments
            </Link>
            <Link href="/templates" className="text-sm font-medium">
              Templates
            </Link>
            <Link href="/settings" className="text-sm font-medium">
              Settings
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Link href="/assessments/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Assessment
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">+5 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-xs text-muted-foreground">+2% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3 days ago</div>
                  <p className="text-xs text-muted-foreground">Last assessment created</p>
                </CardContent>
              </Card>
            </div>
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:w-auto">
                <TabsTrigger value="recent">Recent Assessments</TabsTrigger>
                <TabsTrigger value="websites">Websites</TabsTrigger>
                <TabsTrigger value="business">Business Plans</TabsTrigger>
              </TabsList>
              <TabsContent value="recent" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recentAssessments.map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="websites" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {websiteAssessments.map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="business" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {businessPlanAssessments.map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

function AssessmentCard({ assessment }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{assessment.name}</CardTitle>
          {assessment.type === "website" && <Globe className="h-5 w-5 text-blue-500" />}
          {assessment.type === "business-plan" && <FileText className="h-5 w-5 text-green-500" />}
          {assessment.type === "design" && <PaintBucket className="h-5 w-5 text-purple-500" />}
        </div>
        <CardDescription>{assessment.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-sm font-medium">{assessment.score}%</div>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full ${getScoreColorClass(assessment.score)}`} style={{ width: `${assessment.score}%` }} />
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/assessments/${assessment.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

function getScoreColorClass(score) {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-yellow-500"
  return "bg-red-500"
}

const recentAssessments = [
  {
    id: "1",
    name: "Company Website Audit",
    description: "Quarterly assessment of main website",
    type: "website",
    score: 87,
    date: "2023-04-25",
  },
  {
    id: "2",
    name: "Q2 Business Plan",
    description: "Review of Q2 business strategy",
    type: "business-plan",
    score: 72,
    date: "2023-04-20",
  },
  {
    id: "3",
    name: "Brand Redesign",
    description: "Evaluation of new brand assets",
    type: "design",
    score: 91,
    date: "2023-04-18",
  },
  {
    id: "4",
    name: "Client Portal",
    description: "Accessibility audit for client portal",
    type: "website",
    score: 64,
    date: "2023-04-15",
  },
  {
    id: "5",
    name: "Marketing Materials",
    description: "Review of Q2 marketing collateral",
    type: "design",
    score: 78,
    date: "2023-04-10",
  },
  {
    id: "6",
    name: "Expansion Strategy",
    description: "Assessment of market expansion plan",
    type: "business-plan",
    score: 83,
    date: "2023-04-05",
  },
]

const websiteAssessments = recentAssessments.filter((a) => a.type === "website")
const businessPlanAssessments = recentAssessments.filter((a) => a.type === "business-plan")
