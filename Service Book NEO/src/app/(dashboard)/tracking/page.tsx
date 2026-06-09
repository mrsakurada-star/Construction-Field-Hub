import { getTrackingHistory } from "@/app/actions"
import { TrackingView } from "./TrackingView"
import { type Request, type BillingItem } from "@prisma/client"

type TrackingResult = Request & { billingItems: BillingItem[] }

export default async function TrackingPage(props: { searchParams: Promise<{ q?: string }> }) {
    const searchParams = await props.searchParams
    const q = searchParams.q || ""
    const results = (q ? await getTrackingHistory(q) : []) as TrackingResult[]

    return (
        <TrackingView query={q} results={results} />
    )
}
