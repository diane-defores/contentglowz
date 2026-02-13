"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Globe, FileText, PaintBucket, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewAssessment() {
  const router = useRouter()
  const [assessmentType, setAssessmentType] = useState("website")

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, we would save the assessment data
    // For now, we'll just redirect to the appropriate assessment page
    router.push(`/assessments/${assessmentType}`)
  }

  return (
    <div className="container py-10">
      <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Create New Assessment</h1>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
              <CardDescription>Provide basic information about what you're assessing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Assessment Name</Label>
                <Input id="name" placeholder="E.g., Company Website Q2 Review" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Brief description of what you're assessing and why" rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Assessment Type</Label>
                <RadioGroup
                  defaultValue="website"
                  className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3"
                  onValueChange={setAssessmentType}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="website" id="website" className="sr-only" />
                    <Label
                      htmlFor="website"
                      className="flex w-full cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Globe className="mb-3 h-6 w-6 text-blue-500" />
                      <div className="text-center">
                        <div className="text-sm font-medium">Website</div>
                        <div className="text-xs text-muted-foreground">
                          Assess responsiveness, SEO, and accessibility
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="business-plan" id="business-plan" className="sr-only" />
                    <Label
                      htmlFor="business-plan"
                      className="flex w-full cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <FileText className="mb-3 h-6 w-6 text-green-500" />
                      <div className="text-center">
                        <div className="text-sm font-medium">Business Plan</div>
                        <div className="text-xs text-muted-foreground">
                          Evaluate strategy, market analysis, and financials
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="design" id="design" className="sr-only" />
                    <Label
                      htmlFor="design"
                      className="flex w-full cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <PaintBucket className="mb-3 h-6 w-6 text-purple-500" />
                      <div className="text-center">
                        <div className="text-sm font-medium">Graphic Design</div>
                        <div className="text-xs text-muted-foreground">Check visual consistency and branding</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">
                  {assessmentType === "website"
                    ? "Website URL"
                    : assessmentType === "business-plan"
                      ? "Document Link"
                      : "Design Files Link"}
                </Label>
                <Input
                  id="url"
                  placeholder={
                    assessmentType === "website"
                      ? "https://example.com"
                      : assessmentType === "business-plan"
                        ? "Google Drive or Dropbox link"
                        : "Figma, Sketch, or other design tool link"
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Continue to Assessment
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
