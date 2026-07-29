import { LlmRouting } from "@/components/dashboard/llm-routing"

export default function RouterModule() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <h1 className="text-page-title">Model Router</h1>
        <p className="mt-1 text-body-sm">Live semantic routing status and downstream handler traffic</p>
      </div>
      <LlmRouting />
    </div>
  )
}
