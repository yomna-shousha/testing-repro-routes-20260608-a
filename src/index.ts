export default {
  async fetch(request: Request): Promise<Response> {
    return Response.json({
      worker: "testing-repro-routes-20260608-a",
      deployedBy: "wrangler-versions-upload-no-routes",
      url: request.url,
    });
  },
};
