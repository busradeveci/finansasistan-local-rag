import { LlmRouting } from "@/components/workstation/llm-routing"

export default function InferenceRoutingModule() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <h1 className="text-base font-semibold tracking-tight text-stone-900">Model Routing</h1>
        <p className="text-xs text-stone-500">Live AI decision engine and request orchestration status</p>
      </div>
      <LlmRouting />
    </div>
  )
}
