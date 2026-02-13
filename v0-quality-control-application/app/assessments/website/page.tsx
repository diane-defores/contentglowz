"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Globe, Save, Download, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function WebsiteAssessment() {
  const [scores, setScores] = useState({
    responsiveness: {
      mobileOptimization: 4,
      tabletOptimization: 3,
      desktopOptimization: 5,
      loadingSpeed: 3,
      adaptiveContent: 4,
    },
    seo: {
      metaTags: 4,
      headings: 3,
      urlStructure: 5,
      contentQuality: 4,
      internalLinking: 3,
    },
    accessibility: {
      colorContrast: 2,
      keyboardNavigation: 3,
      altText: 4,
      ariaLabels: 2,
      semanticHTML: 3,
    },
  })

  const [notes, setNotes] = useState({
    responsiveness: "",
    seo: "",
    accessibility: "",
  })

  const [checklist, setChecklist] = useState({
    responsiveness: {
      viewportMeta: true,
      fluidImages: true,
      touchFriendly: false,
      noHorizontalScroll: true,
      fontSizeResponsive: false,
    },
    seo: {
      titleTag: true,
      metaDescription: true,
      h1Present: true,
      canonicalTag: false,
      structuredData: false,
    },
    accessibility: {
      skipToContent: false,
      formLabels: true,
      focusStyles: false,
      headingHierarchy: true,
      landmarkRoles: false,
    },
  })

  const calculateCategoryScore = (category) => {
    const values = Object.values(scores[category])
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 20)
  }

  const calculateOverallScore = () => {
    const responsiveness = calculateCategoryScore("responsiveness")
    const seo = calculateCategoryScore("seo")
    const accessibility = calculateCategoryScore("accessibility")
    return Math.round((responsiveness + seo + accessibility) / 3)
  }

  const handleSliderChange = (category, criterion, value) => {
    setScores({
      ...scores,
      [category]: {
        ...scores[category],
        [criterion]: value[0],
      },
    })
  }

  const handleNotesChange = (category, value) => {
    setNotes({
      ...notes,
      [category]: value,
    })
  }

  const handleChecklistChange = (category, item) => {
    setChecklist({
      ...checklist,
      [category]: {
        ...checklist[category],
        [item]: !checklist[category][item],
      },
    })
  }

  const getScoreClass = (score) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getProgressClass = (score) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="container py-10">
      <Link
        href="/assessments/new"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Assessment Setup
      </Link>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Website Assessment</h1>
              <p className="text-muted-foreground">Company Website Q2 Review</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Overall Score</CardTitle>
            <CardDescription>Combined score across all assessment categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Score</div>
              <div className={`text-2xl font-bold ${getScoreClass(calculateOverallScore())}`}>
                {calculateOverallScore()}%
              </div>
            </div>
            <Progress
              value={calculateOverallScore()}
              className="h-3"
              indicatorClassName={getProgressClass(calculateOverallScore())}
            />

            <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Responsiveness</div>
                <div className={`text-xl font-bold ${getScoreClass(calculateCategoryScore("responsiveness"))}`}>
                  {calculateCategoryScore("responsiveness")}%
                </div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">SEO</div>
                <div className={`text-xl font-bold ${getScoreClass(calculateCategoryScore("seo"))}`}>
                  {calculateCategoryScore("seo")}%
                </div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Accessibility</div>
                <div className={`text-xl font-bold ${getScoreClass(calculateCategoryScore("accessibility"))}`}>
                  {calculateCategoryScore("accessibility")}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="responsiveness">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="responsiveness">Responsiveness</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          </TabsList>

          <TabsContent value="responsiveness" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Responsiveness Scoring</CardTitle>
                <CardDescription>
                  Rate how well the website adapts to different devices and screen sizes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(scores.responsiveness).map(([criterion, value]) => (
                    <div key={criterion} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={criterion}>
                          {criterion.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <span className="text-sm font-medium">{value}/5</span>
                      </div>
                      <Slider
                        id={criterion}
                        min={1}
                        max={5}
                        step={1}
                        value={[value]}
                        onValueChange={(value) => handleSliderChange("responsiveness", criterion, value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Label htmlFor="responsiveness-notes">Notes</Label>
                  <Textarea
                    id="responsiveness-notes"
                    placeholder="Add your observations about the website's responsiveness..."
                    value={notes.responsiveness}
                    onChange={(e) => handleNotesChange("responsiveness", e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsiveness Checklist</CardTitle>
                <CardDescription>Essential elements for a responsive website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(checklist.responsiveness).map(([item, checked]) => (
                    <div key={item} className="flex items-start space-x-2">
                      <Checkbox
                        id={`responsiveness-${item}`}
                        checked={checked}
                        onCheckedChange={() => handleChecklistChange("responsiveness", item)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`responsiveness-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getChecklistDescription("responsiveness", item)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Suggested improvements for responsiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getRecommendations("responsiveness", scores.responsiveness, checklist.responsiveness).map(
                    (rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        {rec.priority === "high" ? (
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                        )}
                        <div>
                          <h4 className="text-sm font-medium">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Scoring</CardTitle>
                <CardDescription>Rate how well the website is optimized for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(scores.seo).map(([criterion, value]) => (
                    <div key={criterion} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={criterion}>
                          {criterion.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <span className="text-sm font-medium">{value}/5</span>
                      </div>
                      <Slider
                        id={criterion}
                        min={1}
                        max={5}
                        step={1}
                        value={[value]}
                        onValueChange={(value) => handleSliderChange("seo", criterion, value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Label htmlFor="seo-notes">Notes</Label>
                  <Textarea
                    id="seo-notes"
                    placeholder="Add your observations about the website's SEO..."
                    value={notes.seo}
                    onChange={(e) => handleNotesChange("seo", e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Checklist</CardTitle>
                <CardDescription>Essential elements for search engine optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(checklist.seo).map(([item, checked]) => (
                    <div key={item} className="flex items-start space-x-2">
                      <Checkbox
                        id={`seo-${item}`}
                        checked={checked}
                        onCheckedChange={() => handleChecklistChange("seo", item)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`seo-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">{getChecklistDescription("seo", item)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Suggested improvements for SEO</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getRecommendations("seo", scores.seo, checklist.seo).map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      {rec.priority === "high" ? (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                      )}
                      <div>
                        <h4 className="text-sm font-medium">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accessibility" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Scoring</CardTitle>
                <CardDescription>Rate how accessible the website is for all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(scores.accessibility).map(([criterion, value]) => (
                    <div key={criterion} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={criterion}>
                          {criterion.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <span className="text-sm font-medium">{value}/5</span>
                      </div>
                      <Slider
                        id={criterion}
                        min={1}
                        max={5}
                        step={1}
                        value={[value]}
                        onValueChange={(value) => handleSliderChange("accessibility", criterion, value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Label htmlFor="accessibility-notes">Notes</Label>
                  <Textarea
                    id="accessibility-notes"
                    placeholder="Add your observations about the website's accessibility..."
                    value={notes.accessibility}
                    onChange={(e) => handleNotesChange("accessibility", e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accessibility Checklist</CardTitle>
                <CardDescription>Essential elements for an accessible website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(checklist.accessibility).map(([item, checked]) => (
                    <div key={item} className="flex items-start space-x-2">
                      <Checkbox
                        id={`accessibility-${item}`}
                        checked={checked}
                        onCheckedChange={() => handleChecklistChange("accessibility", item)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`accessibility-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getChecklistDescription("accessibility", item)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Suggested improvements for accessibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getRecommendations("accessibility", scores.accessibility, checklist.accessibility).map(
                    (rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        {rec.priority === "high" ? (
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-amber-500 mt-0.5" />
                        )}
                        <div>
                          <h4 className="text-sm font-medium">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Save Draft</Button>
          <Button>Complete Assessment</Button>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getChecklistDescription(category, item) {
  const descriptions = {
    responsiveness: {
      viewportMeta: "Viewport meta tag is properly set for mobile devices",
      fluidImages: "Images resize proportionally and don't overflow containers",
      touchFriendly: "Touch targets are at least 44x44 pixels for mobile users",
      noHorizontalScroll: "No horizontal scrolling is required on mobile devices",
      fontSizeResponsive: "Font sizes adjust appropriately across different screen sizes",
    },
    seo: {
      titleTag: "Unique, descriptive title tag under 60 characters",
      metaDescription: "Compelling meta description under 160 characters",
      h1Present: "Page has a single, descriptive H1 heading",
      canonicalTag: "Canonical tag is properly implemented",
      structuredData: "Structured data/schema markup is implemented",
    },
    accessibility: {
      skipToContent: "Skip to content link for keyboard users",
      formLabels: "All form fields have associated labels",
      focusStyles: "Visible focus styles for keyboard navigation",
      headingHierarchy: "Proper heading hierarchy (H1, H2, etc.)",
      landmarkRoles: "ARIA landmark roles are used appropriately",
    },
  }

  return descriptions[category][item] || ""
}

function getRecommendations(category, scores, checklist) {
  // Generate recommendations based on scores and checklist items
  const recommendations = []

  if (category === "responsiveness") {
    if (scores.mobileOptimization < 4) {
      recommendations.push({
        title: "Improve Mobile Experience",
        description:
          "The website needs better optimization for mobile devices. Consider implementing a mobile-first approach.",
        priority: "high",
      })
    }

    if (scores.loadingSpeed < 4) {
      recommendations.push({
        title: "Optimize Loading Speed",
        description: "Page loading speed is slow on mobile devices. Compress images and minimize CSS/JavaScript.",
        priority: "high",
      })
    }

    if (!checklist.touchFriendly) {
      recommendations.push({
        title: "Increase Touch Target Sizes",
        description: "Make buttons and interactive elements larger for better touch interaction on mobile devices.",
        priority: "medium",
      })
    }
  }

  if (category === "seo") {
    if (scores.metaTags < 4) {
      recommendations.push({
        title: "Optimize Meta Tags",
        description: "Improve title tags and meta descriptions to be more descriptive and include relevant keywords.",
        priority: "high",
      })
    }

    if (!checklist.structuredData) {
      recommendations.push({
        title: "Implement Structured Data",
        description: "Add schema markup to help search engines understand your content better.",
        priority: "medium",
      })
    }

    if (scores.contentQuality < 4) {
      recommendations.push({
        title: "Enhance Content Quality",
        description: "Improve content depth and relevance to target keywords and user intent.",
        priority: "high",
      })
    }
  }

  if (category === "accessibility") {
    if (scores.colorContrast < 3) {
      recommendations.push({
        title: "Improve Color Contrast",
        description:
          "Text and background colors don't have sufficient contrast. Aim for at least 4.5:1 ratio for normal text.",
        priority: "high",
      })
    }

    if (!checklist.skipToContent) {
      recommendations.push({
        title: "Add Skip Navigation Link",
        description: "Implement a skip to content link to help keyboard users bypass navigation menus.",
        priority: "medium",
      })
    }

    if (scores.ariaLabels < 3) {
      recommendations.push({
        title: "Add ARIA Labels",
        description: "Improve screen reader compatibility by adding appropriate ARIA labels to interactive elements.",
        priority: "high",
      })
    }
  }

  return recommendations
}
