import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, FileText, PaintBucket, PlusCircle } from "lucide-react"

export default function TemplatesPage() {
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessment Templates</h1>
          <p className="text-muted-foreground mt-1">Use or customize pre-built assessment templates</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
          <TabsTrigger value="business">Business Plans</TabsTrigger>
          <TabsTrigger value="design">Graphic Design</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="websites" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allTemplates
              .filter((template) => template.type === "website")
              .map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allTemplates
              .filter((template) => template.type === "business-plan")
              .map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allTemplates
              .filter((template) => template.type === "design")
              .map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TemplateCard({ template }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{template.name}</CardTitle>
          {template.type === "website" && <Globe className="h-5 w-5 text-blue-500" />}
          {template.type === "business-plan" && <FileText className="h-5 w-5 text-green-500" />}
          {template.type === "design" && <PaintBucket className="h-5 w-5 text-purple-500" />}
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">Categories:</span> {template.categories.join(", ")}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Criteria:</span> {template.criteriaCount} criteria
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full gap-2">
          <Button variant="outline" className="w-full">
            Preview
          </Button>
          <Button className="w-full">Use Template</Button>
        </div>
      </CardFooter>
    </Card>
  )
}

const allTemplates = [
  {
    id: "1",
    name: "Website Accessibility Audit",
    description: "Comprehensive assessment of website accessibility standards",
    type: "website",
    categories: ["Accessibility", "Compliance"],
    criteriaCount: 25,
  },
  {
    id: "2",
    name: "E-commerce Website Review",
    description: "Evaluate user experience and conversion optimization",
    type: "website",
    categories: ["E-commerce", "UX"],
    criteriaCount: 30,
  },
  {
    id: "3",
    name: "Startup Business Plan",
    description: "Assessment template for early-stage startup business plans",
    type: "business-plan",
    categories: ["Startup", "Funding"],
    criteriaCount: 20,
  },
  {
    id: "4",
    name: "Brand Identity Package",
    description: "Evaluate brand identity design and consistency",
    type: "design",
    categories: ["Branding", "Visual Identity"],
    criteriaCount: 18,
  },
  {
    id: "5",
    name: "Mobile App UX Audit",
    description: "Comprehensive mobile app user experience assessment",
    type: "website",
    categories: ["Mobile", "UX"],
    criteriaCount: 28,
  },
  {
    id: "6",
    name: "Marketing Collateral Review",
    description: "Assess marketing materials for brand consistency and impact",
    type: "design",
    categories: ["Marketing", "Print"],
    criteriaCount: 22,
  },
  {
    id: "7",
    name: "Expansion Business Plan",
    description: "Template for evaluating business expansion strategies",
    type: "business-plan",
    categories: ["Growth", "Strategy"],
    criteriaCount: 24,
  },
  {
    id: "8",
    name: "SEO Performance Audit",
    description: "Comprehensive website SEO assessment template",
    type: "website",
    categories: ["SEO", "Performance"],
    criteriaCount: 32,
  },
  {
    id: "9",
    name: "Product Packaging Design",
    description: "Evaluate product packaging design effectiveness",
    type: "design",
    categories: ["Packaging", "Retail"],
    criteriaCount: 20,
  },
]
