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
import { ArrowLeft, FileText, Save, Download, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function BusinessPlanAssessment() {
  const [scores, setScores] = useState({
    executiveSummary: {
      clarity: 4,
      completeness: 3,
      compellingVision: 4,
      valueProposition: 5,
      conciseness: 3,
    },
    marketAnalysis: {
      targetMarketDefinition: 4,
      competitiveAnalysis: 3,
      marketSize: 4,
      trendAnalysis: 2,
      customerInsights: 3,
    },
    financials: {
      projectionRealism: 3,
      breakEvenAnalysis: 2,
      cashFlowManagement: 3,
      fundingRequirements: 4,
      riskAssessment: 2,
    },
  })

  const [notes, setNotes] = useState({
    executiveSummary: "",
    marketAnalysis: "",
    financials: "",
  })

  const [checklist, setChecklist] = useState({
    executiveSummary: {
      businessDescription: true,
      problemSolution: true,
      uniqueSellingPoint: true,
      teamHighlights: false,
      growthPotential: true,
    },
    marketAnalysis: {
      industryOverview: true,
      targetDemographics: true,
      competitorProfiles: false,
      marketEntryStrategy: true,
      swotAnalysis: false,
    },
    financials: {
      salesForecast: true,
      expenseProjections: true,
      balanceSheet: false,
      cashFlowStatement: true,
      fundingStrategy: false,
    },
  })

  const calculateCategoryScore = (category) => {
    const values = Object.values(scores[category])
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 20)
  }

  const calculateOverallScore = () => {
    const executiveSummary = calculateCategoryScore("executiveSummary")
    const marketAnalysis = calculateCategoryScore("marketAnalysis")
    const financials = calculateCategoryScore("financials")
    return Math.round((executiveSummary + marketAnalysis + financials) / 3)
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
            <FileText className="h-8 w-8 text-green-500" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Business Plan Assessment</h1>
              <p className="text-muted-foreground">Q2 Business Strategy Review</p>
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
                <div className="text-sm font-medium text-muted-foreground mb-1">Executive Summary</div>
                <div className={`text-xl font-bold ${getScoreClass(calculateCategoryScore("executiveSummary"))}`}>
                  {calculateCategoryScore("executiveSummary")}%
                </div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Market Analysis</div>
                <div className={`text-xl font-bold ${getScoreClass(calculateCategoryScore("marketAnalysis"))}`}>
                  {calculateCategoryScore("marketAnalysis")}%
                </div>
              </div>
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Financials</div>
                <div className={`text-xl font-bold ${getScoreClass(calculateCategoryScore("financials"))}`}>
                  {calculateCategoryScore("financials")}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="executiveSummary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="executiveSummary">Executive Summary</TabsTrigger>
            <TabsTrigger value="marketAnalysis">Market Analysis</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
          </TabsList>

          <TabsContent value="executiveSummary" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary Scoring</CardTitle>
                <CardDescription>Rate the quality and effectiveness of the executive summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(scores.executiveSummary).map(([criterion, value]) => (
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
                        onValueChange={(value) => handleSliderChange("executiveSummary", criterion, value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Label htmlFor="executiveSummary-notes">Notes</Label>
                  <Textarea
                    id="executiveSummary-notes"
                    placeholder="Add your observations about the executive summary..."
                    value={notes.executiveSummary}
                    onChange={(e) => handleNotesChange("executiveSummary", e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Executive Summary Checklist</CardTitle>
                <CardDescription>Essential elements for an effective executive summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(checklist.executiveSummary).map(([item, checked]) => (
                    <div key={item} className="flex items-start space-x-2">
                      <Checkbox
                        id={`executiveSummary-${item}`}
                        checked={checked}
                        onCheckedChange={() => handleChecklistChange("executiveSummary", item)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`executiveSummary-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getBusinessChecklistDescription("executiveSummary", item)}
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
                <CardDescription>Suggested improvements for the executive summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getBusinessRecommendations(
                    "executiveSummary",
                    scores.executiveSummary,
                    checklist.executiveSummary,
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

          <TabsContent value="marketAnalysis" className="mt-6 space-y-6">
            {/* Similar structure to executiveSummary tab, with market analysis specific content */}
            <Card>
              <CardHeader>
                <CardTitle>Market Analysis Scoring</CardTitle>
                <CardDescription>Rate the quality and depth of the market analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(scores.marketAnalysis).map(([criterion, value]) => (
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
                        onValueChange={(value) => handleSliderChange("marketAnalysis", criterion, value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Label htmlFor="marketAnalysis-notes">Notes</Label>
                  <Textarea
                    id="marketAnalysis-notes"
                    placeholder="Add your observations about the market analysis..."
                    value={notes.marketAnalysis}
                    onChange={(e) => handleNotesChange("marketAnalysis", e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Analysis Checklist</CardTitle>
                <CardDescription>Essential elements for an effective market analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(checklist.marketAnalysis).map(([item, checked]) => (
                    <div key={item} className="flex items-start space-x-2">
                      <Checkbox
                        id={`marketAnalysis-${item}`}
                        checked={checked}
                        onCheckedChange={() => handleChecklistChange("marketAnalysis", item)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`marketAnalysis-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getBusinessChecklistDescription("marketAnalysis", item)}
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
                <CardDescription>Suggested improvements for the market analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getBusinessRecommendations("marketAnalysis", scores.marketAnalysis, checklist.marketAnalysis).map(
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

          <TabsContent value="financials" className="mt-6 space-y-6">
            {/* Similar structure to executiveSummary tab, with financials specific content */}
            <Card>
              <CardHeader>
                <CardTitle>Financials Scoring</CardTitle>
                <CardDescription>Rate the quality and accuracy of the financial projections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(scores.financials).map(([criterion, value]) => (
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
                        onValueChange={(value) => handleSliderChange("financials", criterion, value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Label htmlFor="financials-notes">Notes</Label>
                  <Textarea
                    id="financials-notes"
                    placeholder="Add your observations about the financial projections..."
                    value={notes.financials}
                    onChange={(e) => handleNotesChange("financials", e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financials Checklist</CardTitle>
                <CardDescription>Essential elements for effective financial projections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(checklist.financials).map(([item, checked]) => (
                    <div key={item} className="flex items-start space-x-2">
                      <Checkbox
                        id={`financials-${item}`}
                        checked={checked}
                        onCheckedChange={() => handleChecklistChange("financials", item)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={`financials-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {item.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getBusinessChecklistDescription("financials", item)}
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
                <CardDescription>Suggested improvements for the financial projections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getBusinessRecommendations("financials", scores.financials, checklist.financials).map(
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
function getBusinessChecklistDescription(category, item) {
  const descriptions = {
    executiveSummary: {
      businessDescription: "Clear description of the business and its purpose",
      problemSolution: "Clearly articulates the problem and your solution",
      uniqueSellingPoint: "Highlights what makes your business unique",
      teamHighlights: "Brief overview of key team members and their expertise",
      growthPotential: "Outlines potential for growth and scalability",
    },
    marketAnalysis: {
      industryOverview: "Overview of the industry landscape and trends",
      targetDemographics: "Detailed description of target customer segments",
      competitorProfiles: "Analysis of direct and indirect competitors",
      marketEntryStrategy: "Clear strategy for entering or expanding in the market",
      swotAnalysis: "Comprehensive SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis",
    },
    financials: {
      salesForecast: "Realistic sales projections with supporting assumptions",
      expenseProjections: "Detailed breakdown of operating and capital expenses",
      balanceSheet: "Projected balance sheet showing assets, liabilities, and equity",
      cashFlowStatement: "Cash flow projections showing timing of inflows and outflows",
      fundingStrategy: "Clear plan for how the business will be funded",
    },
  }

  return descriptions[category][item] || ""
}

function getBusinessRecommendations(category, scores, checklist) {
  // Generate recommendations based on scores and checklist items
  const recommendations = []

  if (category === "executiveSummary") {
    if (scores.clarity < 4) {
      recommendations.push({
        title: "Improve Clarity",
        description:
          "The executive summary needs to be more clear and concise. Focus on communicating the core business concept in simpler terms.",
        priority: "high",
      })
    }

    if (scores.valueProposition < 4) {
      recommendations.push({
        title: "Strengthen Value Proposition",
        description:
          "The value proposition needs to be more compelling. Clearly articulate why customers should choose your solution over alternatives.",
        priority: "high",
      })
    }

    if (!checklist.teamHighlights) {
      recommendations.push({
        title: "Add Team Information",
        description:
          "Include brief information about key team members and their relevant expertise to build credibility.",
        priority: "medium",
      })
    }
  }

  if (category === "marketAnalysis") {
    if (scores.competitiveAnalysis < 4) {
      recommendations.push({
        title: "Enhance Competitive Analysis",
        description:
          "Provide a more thorough analysis of competitors, including their strengths, weaknesses, and market positioning.",
        priority: "high",
      })
    }

    if (scores.trendAnalysis < 3) {
      recommendations.push({
        title: "Improve Market Trend Analysis",
        description:
          "Include more data and insights on current and emerging market trends that could impact your business.",
        priority: "high",
      })
    }

    if (!checklist.swotAnalysis) {
      recommendations.push({
        title: "Add SWOT Analysis",
        description:
          "Include a comprehensive SWOT analysis to demonstrate understanding of internal and external factors.",
        priority: "medium",
      })
    }
  }

  if (category === "financials") {
    if (scores.projectionRealism < 4) {
      recommendations.push({
        title: "Make Projections More Realistic",
        description:
          "Financial projections appear overly optimistic. Use industry benchmarks and historical data to create more realistic forecasts.",
        priority: "high",
      })
    }

    if (scores.breakEvenAnalysis < 3) {
      recommendations.push({
        title: "Improve Break-Even Analysis",
        description: "Include a more detailed break-even analysis with clear assumptions and sensitivity analysis.",
        priority: "high",
      })
    }

    if (scores.riskAssessment < 3) {
      recommendations.push({
        title: "Enhance Risk Assessment",
        description: "Include a more thorough assessment of financial risks and mitigation strategies.",
        priority: "high",
      })
    }

    if (!checklist.balanceSheet) {
      recommendations.push({
        title: "Add Projected Balance Sheet",
        description:
          "Include a projected balance sheet to provide a more complete picture of the company's financial position.",
        priority: "medium",
      })
    }
  }

  return recommendations
}
