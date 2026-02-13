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
import { ArrowLeft, PaintBucket, Save, Download, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function DesignAssessment() {
  const [scores, setScores] = useState({
    visualConsistency: {
      colorHarmony: 4,
      typographyConsistency: 3,
      layoutBalance: 4,
      visualHierarchy: 3,
      whitespaceUsage: 5,
    },
    brandingGuidelines: {
      logoUsage: 5,
      colorPaletteAdherence: 4,
      typographyRules: 3,
      imageryStyle: 4,
      tonalConsistency: 3,
    },
    aestheticAppeal: {
      modernityLevel: 4,
      visualImpact: 3,
      emotionalResponse: 4,
      memorability: 3,
      professionalismLevel: 5,
    },
  })

  const [notes, setNotes] = useState({
    visualConsistency: "",
    brandingGuidelines: "",
    aestheticAppeal: "",
  })

  const [checklist, setChecklist] = useState({
    visualConsistency: {
      gridSystem: true,
      responsiveDesign: true,
      consistentSpacing: false,
      alignmentPrinciples: true,
      colorContrast: true,
    },
    brandingGuidelines: {
      brandBook: true,
      logoProtection: true,
      secondaryElements: false,
      brandVoice: true,
      accessibilityGuidelines: false,
    },
    aestheticAppeal: {
      targetAudienceAppeal: true,
      industryStandards: true,
      trendAwareness: false,
      uniqueElements: true,
      cohesiveStyle: false,
    },
  })

  const calculateCategoryScore = (category) => {
    const values = Object.values(scores[category])
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 20)
  }

  const calculateOverallScore = () => {
    const visualConsistency = calculateCategoryScore("visualConsistency")
    const brandingGuidelines = calculateCategoryScore("brandingGuidelines")
    const aestheticAppeal = calculateCategoryScore("aestheticAppeal")
    return Math.round((visualConsistency + brandingGuidelines + aestheticAppeal) / 3)
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
            <PaintBucket className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Graphic Design Assessment</h1>
              <p className="text-muted-foreground">Brand Redesign Evaluation</p>
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
                <div className="text-sm font-medium text-muted-foreground mb-1">Visual Consistency</div>
                <div className={`text-xl font-bold ${getScoreClass(calculateCategoryScore("visualConsistency"))}`}>
                  {calculateCategoryScore("visualConsistency")}%
                </div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Branding Guidelines</div>
                <div className={`text-xl font-bold ${getScoreClass(calculateCategoryScore("brandingGuidelines"))}`}>
                  {calculateCategoryScore("brandingGuidelines")}%
                </div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Aesthetic Appeal</div>
                <div className={`text-xl font-bold ${getScoreClass(calculateCategoryScore("aestheticAppeal"))}`}>
                  {calculateCategoryScore("aestheticAppeal")}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="visualConsistency">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visualConsistency">Visual Consistency</TabsTrigger>
            <TabsTrigger value="brandingGuidelines">Branding Guidelines</TabsTrigger>
            <TabsTrigger value="aestheticAppeal">Aesthetic Appeal</TabsTrigger>
          </TabsList>

          <TabsContent value="visualConsistency" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visual Consistency Scoring</CardTitle>
                <CardDescription>Rate how consistent the visual elements are across the design</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(scores.visualConsistency).map(([criterion, value]) => (
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
                        onValueChange={(value) => handleSliderChange("visualConsistency", criterion, value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Label htmlFor="visualConsistency-notes">Notes</Label>
                  <Textarea
                    id="visualConsistency-notes"
                    placeholder="Add your observations about the visual consistency..."
                    value={notes.visualConsistency}
                    onChange={(e) => handleNotesChange("visualConsistency", e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visual Consistency Checklist</CardTitle>
                <CardDescription>Essential elements for visual consistency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(checklist.visualConsistency).map(([item, checked]) => (
                    <div key={item} className="flex items-start space-x-2">
                      <Checkbox
                        id={`visualConsistency-${item}`}
                        checked={checked}
                        onCheckedChange={() => handleChecklistChange("visualConsistency", item)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`visualConsistency-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getDesignChecklistDescription("visualConsistency", item)}
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
                <CardDescription>Suggested improvements for visual consistency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getDesignRecommendations(
                    "visualConsistency",
                    scores.visualConsistency,
                    checklist.visualConsistency,
                  ).map((rec, index) => (
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

          <TabsContent value="brandingGuidelines" className="mt-6 space-y-6">
            {/* Similar structure to visualConsistency tab, with branding guidelines specific content */}
            <Card>
              <CardHeader>
                <CardTitle>Branding Guidelines Scoring</CardTitle>
                <CardDescription>Rate how well the design adheres to branding guidelines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(scores.brandingGuidelines).map(([criterion, value]) => (
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
                        onValueChange={(value) => handleSliderChange("brandingGuidelines", criterion, value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Label htmlFor="brandingGuidelines-notes">Notes</Label>
                  <Textarea
                    id="brandingGuidelines-notes"
                    placeholder="Add your observations about adherence to branding guidelines..."
                    value={notes.brandingGuidelines}
                    onChange={(e) => handleNotesChange("brandingGuidelines", e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding Guidelines Checklist</CardTitle>
                <CardDescription>Essential elements for brand consistency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(checklist.brandingGuidelines).map(([item, checked]) => (
                    <div key={item} className="flex items-start space-x-2">
                      <Checkbox
                        id={`brandingGuidelines-${item}`}
                        checked={checked}
                        onCheckedChange={() => handleChecklistChange("brandingGuidelines", item)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`brandingGuidelines-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getDesignChecklistDescription("brandingGuidelines", item)}
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
                <CardDescription>Suggested improvements for branding adherence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getDesignRecommendations(
                    "brandingGuidelines",
                    scores.brandingGuidelines,
                    checklist.brandingGuidelines,
                  ).map((rec, index) => (
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

          <TabsContent value="aestheticAppeal" className="mt-6 space-y-6">
            {/* Similar structure to visualConsistency tab, with aesthetic appeal specific content */}
            <Card>
              <CardHeader>
                <CardTitle>Aesthetic Appeal Scoring</CardTitle>
                <CardDescription>Rate the overall visual appeal and impact of the design</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(scores.aestheticAppeal).map(([criterion, value]) => (
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
                        onValueChange={(value) => handleSliderChange("aestheticAppeal", criterion, value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Label htmlFor="aestheticAppeal-notes">Notes</Label>
                  <Textarea
                    id="aestheticAppeal-notes"
                    placeholder="Add your observations about the aesthetic appeal..."
                    value={notes.aestheticAppeal}
                    onChange={(e) => handleNotesChange("aestheticAppeal", e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aesthetic Appeal Checklist</CardTitle>
                <CardDescription>Essential elements for visual appeal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(checklist.aestheticAppeal).map(([item, checked]) => (
                    <div key={item} className="flex items-start space-x-2">
                      <Checkbox
                        id={`aestheticAppeal-${item}`}
                        checked={checked}
                        onCheckedChange={() => handleChecklistChange("aestheticAppeal", item)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`aestheticAppeal-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getDesignChecklistDescription("aestheticAppeal", item)}
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
                <CardDescription>Suggested improvements for aesthetic appeal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getDesignRecommendations("aestheticAppeal", scores.aestheticAppeal, checklist.aestheticAppeal).map(
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
function getDesignChecklistDescription(category, item) {
  const descriptions = {
    visualConsistency: {
      gridSystem: "Consistent grid system used throughout all designs",
      responsiveDesign: "Design elements adapt appropriately across different sizes",
      consistentSpacing: "Consistent spacing and padding between elements",
      alignmentPrinciples: "Elements are aligned according to design principles",
      colorContrast: "Sufficient contrast between text and background colors",
    },
    brandingGuidelines: {
      brandBook: "Comprehensive brand book or style guide exists",
      logoProtection: "Logo has appropriate clear space and usage rules",
      secondaryElements: "Secondary brand elements are used consistently",
      brandVoice: "Visual elements match the brand's voice and personality",
      accessibilityGuidelines: "Brand guidelines include accessibility considerations",
    },
    aestheticAppeal: {
      targetAudienceAppeal: "Design appeals to the target audience",
      industryStandards: "Design meets or exceeds industry standards",
      trendAwareness: "Design shows awareness of current design trends",
      uniqueElements: "Design includes unique elements that stand out",
      cohesiveStyle: "All elements work together in a cohesive style",
    },
  }

  return descriptions[category][item] || ""
}

function getDesignRecommendations(category, scores, checklist) {
  // Generate recommendations based on scores and checklist items
  const recommendations = []

  if (category === "visualConsistency") {
    if (scores.typographyConsistency < 4) {
      recommendations.push({
        title: "Improve Typography Consistency",
        description:
          "Typography varies too much across designs. Establish a clearer type hierarchy and stick to it consistently.",
        priority: "high",
      })
    }

    if (scores.visualHierarchy < 4) {
      recommendations.push({
        title: "Enhance Visual Hierarchy",
        description:
          "The visual hierarchy needs improvement. Make it clearer which elements are most important through size, color, and positioning.",
        priority: "high",
      })
    }

    if (!checklist.consistentSpacing) {
      recommendations.push({
        title: "Standardize Spacing",
        description: "Implement a consistent spacing system throughout all designs to improve visual harmony.",
        priority: "medium",
      })
    }
  }

  if (category === "brandingGuidelines") {
    if (scores.typographyRules < 4) {
      recommendations.push({
        title: "Follow Typography Guidelines",
        description:
          "Typography doesn't consistently follow brand guidelines. Ensure all text elements use the specified fonts, weights, and sizes.",
        priority: "high",
      })
    }

    if (scores.tonalConsistency < 4) {
      recommendations.push({
        title: "Maintain Tonal Consistency",
        description:
          "The visual tone varies across materials. Ensure all designs maintain the same emotional tone and brand personality.",
        priority: "high",
      })
    }

    if (!checklist.accessibilityGuidelines) {
      recommendations.push({
        title: "Add Accessibility Guidelines",
        description:
          "Include accessibility considerations in your brand guidelines to ensure all materials are usable by everyone.",
        priority: "medium",
      })
    }
  }

  if (category === "aestheticAppeal") {
    if (scores.visualImpact < 4) {
      recommendations.push({
        title: "Increase Visual Impact",
        description:
          "The design lacks visual impact. Consider bolder color choices, more dynamic layouts, or stronger focal points.",
        priority: "high",
      })
    }

    if (scores.memorability < 4) {
      recommendations.push({
        title: "Improve Memorability",
        description:
          "The design isn't particularly memorable. Add unique visual elements or unexpected touches to make it stand out.",
        priority: "high",
      })
    }

    if (!checklist.trendAwareness) {
      recommendations.push({
        title: "Update Design Trends",
        description:
          "The design feels outdated. Incorporate some current design trends while maintaining brand consistency.",
        priority: "medium",
      })
    }

    if (!checklist.cohesiveStyle) {
      recommendations.push({
        title: "Unify Design Elements",
        description:
          "Design elements don't work together cohesively. Ensure all visual components share a common style and purpose.",
        priority: "high",
      })
    }
  }

  return recommendations
}
