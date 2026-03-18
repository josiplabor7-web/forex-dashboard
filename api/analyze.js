module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const body = req.body;

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  };

  if (body.tools && body.tools.some(t => t.type === "web_search_20250305")) {
    headers["anthropic-beta"] = "web-search-2025-03-05";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  res.status(response.status).json(data);
};
