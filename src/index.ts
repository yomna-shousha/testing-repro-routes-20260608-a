export default {
  async fetch(request: Request): Promise<Response> {
    return Response.json({
      worker: "testing-repro-routes-20260608-a",
      deployedBy: "wrangler-minimal-no-routes",
      url: request.url,
    });
  },
};
