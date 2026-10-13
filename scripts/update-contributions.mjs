
import { mkdir, writeFile } from "node:fs/promises";

const username = "BrayceDominic";
const token = process.env.GH_CONTRIBUTIONS_TOKEN;

if (!token) {
  throw new Error("Missing GH_CONTRIBUTIONS_TOKEN environment variable.");
}

const end = new Date();
const start = new Date(end);
start.setUTCFullYear(start.getUTCFullYear() - 1);

const query = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to, includePrivateContributions: true) {
        contributionCalendar {
          totalContributions
        }
      }
    }
  }
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query,
    variables: {
      login: username,
      from: start.toISOString(),
      to: end.toISOString(),
    },
  }),
});

const result = await response.json();

if (!response.ok || result.errors?.length || !result.data?.user) {
  throw new Error(
    JSON.stringify(result.errors ?? result, null, 2)
  );
}

const total =
  result.data.user.contributionsCollection
    .contributionCalendar.totalContributions;

const updated = end.toISOString().slice(0, 10);

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="520" height="126" viewBox="0 0 520 126" role="img" aria-labelledby="title desc">
  <title id="title">GitHub contributions</title>
  <desc id="desc">${total} GitHub contributions in the last year</desc>
  <rect width="518" height="124" x="1" y="1" rx="14" fill="#161b22" stroke="#30363d"/>
  <circle cx="34" cy="34" r="13" fill="#238636"/>
  <path d="M28 34l4 4 8-9" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="58" y="39" font-family="Arial, sans-serif" font-size="16" font-weight="600" fill="#e6edf3">GitHub Contributions</text>
  <text x="26" y="83" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#3fb950">${total.toLocaleString("en-US")}</text>
  <text x="26" y="104" font-family="Arial, sans-serif" font-size="12" fill="#8b949e">Contributions in the last year</text>
  <text x="494" y="104" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="#8b949e">Updated ${updated}</text>
</svg>`.trim();

await mkdir("assets", { recursive: true });
await writeFile("assets/github-contributions.svg", svg + "\n");

console.log(`Updated contribution badge: ${total} contributions`);
