import { fetchClinicalTrial, sourceErrorResponse } from "@/lib/source-adapters";

export async function GET(_request: Request, context: RouteContext<"/api/clinical-trials/[nctId]">) {
  try {
    const { nctId } = await context.params;
    return Response.json({ ok: true, data: await fetchClinicalTrial(nctId) });
  } catch (error) {
    return sourceErrorResponse(error);
  }
}
