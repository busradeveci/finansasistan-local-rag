import { LlmRouting } from "@/components/dashboard/llm-routing"

export default function RouterModule() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <h1 className="text-base font-semibold tracking-tight text-stone-900">Model Router</h1>
        <p className="text-xs text-stone-500">Live semantic routing status and downstream handler traffic</p>
      </div>
      <LlmRouting />
    </div>
  )
}
