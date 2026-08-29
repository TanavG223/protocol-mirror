import { fetchPubMedArticle, sourceErrorResponse } from "@/lib/source-adapters";

export async function GET(_request: Request, context: RouteContext<"/api/pubmed/[pmid]">) {
  try {
    const { pmid } = await context.params;
    return Response.json({ ok: true, data: await fetchPubMedArticle(pmid) });
  } catch (error) {
    return sourceErrorResponse(error);
  }
}
