import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/app/Blocks";
import { getWorkspace } from "@/lib/app/workspaces";

export const metadata = { title: "Developers" };

// Every snippet below is the engine's real interface, checked against ../mitra:
// lib/sdk/client.ts (MitraClient, agents.register), app/api/v1/mandates/route.ts
// (createMandateSchema, operator token) and scripts/mitra-mcp.ts (MITRA_API_URL).

const REGISTER = `// The SDK ships inside the engine repo (lib/sdk). There is no npm package yet.
import { MitraClient } from "../mitra/lib/sdk";
import { privateKeyToAccount } from "viem/accounts";

const wallet = privateKeyToAccount(process.env.AGENT_KEY as \`0x\${string}\`);

const mitra = new MitraClient({
  baseUrl: "http://localhost:3005",   // the engine's API root
  agentId: "agent_research",
  chainId: 84532,                     // Base Sepolia
  signer: { address: wallet.address, signTypedData: (t) => wallet.signTypedData(t) },
});

// Proves the agent controls this wallet, by signing the registration.
await mitra.agents.register({
  name: "Research agent",
  owner: "acme",
  capabilities: ["data_indexing"],
  chain: "base",
});`;

const LIMITS = `curl -X POST http://localhost:3005/api/v1/mandates \\
  -H "Authorization: Bearer $MITRA_OPERATOR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Research sprint",
    "principal": "acme",
    "agentId": "agent_research",
    "vaultId": "<your vault id>",
    "asset": "USDC",
    "budget": 2000,
    "maxTransaction": 500,
    "velocityLimit": { "amount": 1000, "windowMinutes": 1440 },
    "allowedCounterparties": ["agent_atlas_data"],
    "allowedCapabilities": ["data_indexing"],
    "approvedChains": ["base"],
    "expiresAt": "2026-11-10T00:00:00Z"
  }'`;

const CONNECT = `{
  "mcpServers": {
    "mitra": {
      "command": "node",
      "args": ["/path/to/mitra/bin/mitra-mcp.mjs"],
      "env": { "MITRA_API_URL": "http://localhost:3005" }
    }
  }
}`;

export default async function Developers({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();

  return (
    <>
      <PageHead
        title="Developers"
        sub="Agents never use this app. They talk to Mitra through the SDK, the API or MCP. These are the agent-side steps to get one working."
      />
      {w.demo ? null : (
        <p className="lv-note">
          The app already did the on-chain part from your wallet: the vault and each agent’s limits in the vault contract (
          <Link href={`/app/${w.slug}/agents`}>Agents</Link>). What follows runs on the agent’s side and against the engine.
        </p>
      )}
      <p className="ap-sub" style={{ marginTop: -12 }}>
        Everything here runs against the engine on test networks. Start it with <code className="mono">npm run stack:up</code> in
        the engine repo: the API on port 3005, MCP on 3006.
      </p>

      <section id="register" className="ap-dev">
        <div>
          <span className="ap-step-n">Agent side · 1</span>
          <h2>Register with the engine</h2>
          <p>
            The agent tells the engine who it is, signed by the same wallet you registered on the Agents page, so nobody can
            register an agent they don’t control.
          </p>
          <p>
            <Link href="/docs/quickstart">Quickstart in the docs →</Link>
          </p>
        </div>
        <pre className="ap-code">{REGISTER}</pre>
      </section>

      <section id="limits" className="ap-dev">
        <div>
          <span className="ap-step-n">Agent side · 2</span>
          <h2>Give the engine its rules</h2>
          <p>
            The vault holds the hard limits; the engine holds the policy it checks first: who the agent may pay and for what. You
            set it with your operator token. The agent can read its own rules but the SDK it holds has no way to create or widen
            them.
          </p>
          <p>
            <Link href="/docs/engravings-and-mandates">How limits work →</Link>
          </p>
        </div>
        <pre className="ap-code">{LIMITS}</pre>
      </section>

      <section id="connect" className="ap-dev">
        <div>
          <span className="ap-step-n">Agent side · 3</span>
          <h2>Connect it</h2>
          <p>
            Add Mitra to the agent’s MCP config, or use the SDK directly. The MCP server holds no keys and no money: every tool is
            a call to the API, and every payment still passes the three checks.
          </p>
          <p>
            <Link href="/docs/mcp-gateway">MCP gateway in the docs →</Link>
          </p>
          <p className="lv-hint">
            Known gap: the engine’s vault rail pays from the principal it was started with (its own key), not yet from a vault
            opened here. Until that is configurable, a payment from your vault is not made by the engine, and this app will not
            show one.
          </p>
        </div>
        <pre className="ap-code">{CONNECT}</pre>
      </section>
    </>
  );
}
