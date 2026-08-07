import { LlmRouting } from "@/components/workstation/llm-routing"

export default function InferenceRoutingModule() {
  return (
    <div className="flex flex-col gap-3 h-full min-h-0 bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col mb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Model Routing</h1>
        <p className="text-xs font-medium text-slate-500">Live AI decision engine and request orchestration status</p>
      </div>
      <LlmRouting />
    </div>
  )
}
