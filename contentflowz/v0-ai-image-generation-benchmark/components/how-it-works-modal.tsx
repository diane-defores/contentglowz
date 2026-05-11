"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface HowItWorksModalProps {
  open: boolean
  onClose: () => void
}

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">How It Works</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-sm text-muted-foreground">
          <section>
            <h3 className="text-foreground font-medium mb-2">Parallel Benchmarking</h3>
            <p>
              When you submit a prompt, the benchmark sends requests to all {11} AI image generation models
              simultaneously. Each model is timed independently from the moment the request starts until the image is
              received.
            </p>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">What We Measure</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Generation Time:</strong> How long each model takes to generate the image from your prompt
              </li>
              <li>
                <strong>Cost:</strong> The API cost for each generation based on the provider's pricing
              </li>
              <li>
                <strong>Success Rate:</strong> Which models successfully complete the generation
              </li>
              <li>
                <strong>Request Timing:</strong> The exact delay between each request start to detect any bias
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">Visualizations</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Performance Ranking:</strong> Bar chart showing fastest to slowest models with cost breakdown
              </li>
              <li>
                <strong>Historical Performance:</strong> Line chart tracking how each model performs across multiple
                tests
              </li>
              <li>
                <strong>Image Grid:</strong> Side-by-side comparison of all generated images with timing details
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">Providers</h3>
            <p>This benchmark includes models from multiple providers:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>
                <strong>Fal AI:</strong> FLUX models (Schnell, Dev, Pro variants) and Stable Diffusion
              </li>
              <li>
                <strong>Prodia:</strong> Fast variants of FLUX models and Stable Diffusion
              </li>
              <li>
                <strong>Vercel AI Gateway:</strong> Nano Banana (Gemini 2.5 Flash)
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-foreground font-medium mb-2">Fair Testing</h3>
            <p>
              All models receive the same prompt with identical parameters. Request start times are logged to detect any
              timing bias. The benchmark runs in real-time with live API calls to reflect actual production performance.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
