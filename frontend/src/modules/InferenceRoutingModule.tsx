import { Route } from "lucide-react"
import { LlmRouting } from "@/components/workstation/llm-routing"

export default function InferenceRoutingModule() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-5">
        <header className="flex flex-none items-center gap-2.5">
          <span className="vv-plate h-8 w-8">
            <Route className="h-[16px] w-[16px]" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <h1 className="vv-title-section">Model Routing</h1>
            <p className="vv-caption mt-0.5">
              Live AI decision engine and request orchestration status
            </p>
          </div>
        </header>

        <div className="fluent-scrollbar min-h-0 flex-1 overflow-y-auto pb-6">
          <LlmRouting />
        </div>
      </div>
    </div>
  )
}
